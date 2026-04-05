const { S3Client, CreateBucketCommand, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const VULTR_API_KEY = process.env.VULTR_API_KEY;
const CACHE_FILE = path.join(__dirname, '../../.vultr-storage.json');
const BUCKET_NAME = 'clipchain-clips';

let s3Client = null;
let storageEndpoint = null;
let useLocalFallback = false;

async function loadCachedCredentials() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return data;
    }
  } catch (err) {
    console.log('[Vultr] Could not load cached credentials:', err.message);
  }
  return null;
}

async function saveCachedCredentials(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('[Vultr] Could not save credentials cache:', err.message);
  }
}

async function initVultrStorage() {
  try {
    // Try to load cached credentials first
    const cached = await loadCachedCredentials();
    if (cached && cached.s3_access_key && cached.s3_secret_key && cached.endpoint) {
      console.log('[Vultr] Using cached Object Storage credentials');
      storageEndpoint = cached.endpoint;
      s3Client = new S3Client({
        endpoint: storageEndpoint,
        region: 'us-east-1',
        credentials: {
          accessKeyId: cached.s3_access_key,
          secretAccessKey: cached.s3_secret_key,
        },
        forcePathStyle: true,
      });
      await ensureBucketExists();
      return;
    }

    // Check existing object storage instances
    console.log('[Vultr] Checking for existing Object Storage...');
    const listResp = await axios.get('https://api.vultr.com/v2/object-storage', {
      headers: { Authorization: `Bearer ${VULTR_API_KEY}` },
    });

    let storage = null;
    if (listResp.data.object_storages && listResp.data.object_storages.length > 0) {
      storage = listResp.data.object_storages[0];
      console.log('[Vultr] Found existing Object Storage:', storage.label);
    } else {
      // Get available clusters
      console.log('[Vultr] No existing storage found. Getting clusters...');
      const clustersResp = await axios.get('https://api.vultr.com/v2/object-storage/clusters', {
        headers: { Authorization: `Bearer ${VULTR_API_KEY}` },
      });

      const clusters = clustersResp.data.clusters;
      if (!clusters || clusters.length === 0) {
        throw new Error('No Vultr Object Storage clusters available');
      }

      const clusterId = clusters[0].id;
      console.log('[Vultr] Creating new Object Storage in cluster:', clusterId);

      const createResp = await axios.post(
        'https://api.vultr.com/v2/object-storage',
        { cluster_id: clusterId, label: 'clipchain' },
        { headers: { Authorization: `Bearer ${VULTR_API_KEY}`, 'Content-Type': 'application/json' } }
      );
      storage = createResp.data.object_storage;
      console.log('[Vultr] Created Object Storage:', storage.id);

      // Wait for storage to be ready
      console.log('[Vultr] Waiting for storage to become active...');
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const checkResp = await axios.get(
          `https://api.vultr.com/v2/object-storage/${storage.id}`,
          { headers: { Authorization: `Bearer ${VULTR_API_KEY}` } }
        );
        if (checkResp.data.object_storage.status === 'active') {
          storage = checkResp.data.object_storage;
          break;
        }
        console.log('[Vultr] Storage status:', checkResp.data.object_storage.status);
      }
    }

    if (!storage.s3_access_key || !storage.s3_secret_key) {
      // Fetch full details
      const detailResp = await axios.get(
        `https://api.vultr.com/v2/object-storage/${storage.id}`,
        { headers: { Authorization: `Bearer ${VULTR_API_KEY}` } }
      );
      storage = detailResp.data.object_storage;
    }

    if (!storage.s3_access_key) {
      throw new Error('Vultr Object Storage credentials not available yet');
    }

    // Use the s3_hostname directly from the API response (e.g. "sjc1.vultrobjects.com")
    const s3Host = storage.s3_hostname || `${storage.region || storage.cluster || 'ewr1'}.vultrobjects.com`;
    storageEndpoint = `https://${s3Host}`;

    const credentials = {
      s3_access_key: storage.s3_access_key,
      s3_secret_key: storage.s3_secret_key,
      endpoint: storageEndpoint,
      storage_id: storage.id,
    };

    await saveCachedCredentials(credentials);

    s3Client = new S3Client({
      endpoint: storageEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: storage.s3_access_key,
        secretAccessKey: storage.s3_secret_key,
      },
      forcePathStyle: true,
    });

    await ensureBucketExists();
    console.log('[Vultr] Object Storage initialized successfully');
  } catch (err) {
    console.error('[Vultr] Failed to initialize Object Storage:', err.message);
    console.log('[Vultr] Will use local file fallback');
    useLocalFallback = true;
  }
}

async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log('[Vultr] Bucket exists:', BUCKET_NAME);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log('[Vultr] Creating bucket:', BUCKET_NAME);
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: BUCKET_NAME,
          ACL: 'public-read',
        })
      );
      console.log('[Vultr] Bucket created:', BUCKET_NAME);
    } else {
      throw err;
    }
  }
}

async function uploadToVultr(filePath, filename, mimeType = 'video/mp4') {
  if (useLocalFallback || !s3Client) {
    console.log('[Vultr] Using local fallback for file:', filename);
    return `http://localhost:${process.env.PORT || 3001}/uploads/${path.basename(filePath)}`;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const key = `clips/${Date.now()}-${filename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: mimeType,
        ACL: 'public-read',
      })
    );

    const url = `${storageEndpoint}/${BUCKET_NAME}/${key}`;
    console.log('[Vultr] File uploaded:', url);
    return url;
  } catch (err) {
    console.error('[Vultr] Upload failed, using local fallback:', err.message);
    return `http://localhost:${process.env.PORT || 3001}/uploads/${path.basename(filePath)}`;
  }
}

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function getPresignedUploadUrl(filename, contentType = 'video/mp4') {
  if (useLocalFallback || !s3Client) {
    throw new Error('Vultr S3 not initialized — cannot generate presigned URL');
  }
  const key = `clips/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const publicUrl = `${storageEndpoint}/${BUCKET_NAME}/${key}`;
  return { url, key, publicUrl };
}

module.exports = { initVultrStorage, uploadToVultr, getPresignedUploadUrl };
