import fetch from 'node-fetch';
import crypto from 'crypto';

// Backblaze B2 configuration
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'growvia';
const B2_KEY_ID = process.env.B2_KEY_ID || '0035a5bf5b3643e0000000001';
const B2_KEY_NAME = process.env.B2_KEY_NAME || 'Growvia';
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY || '';

// Get B2 authorization and upload URL
async function getB2Auth() {
  const authString = Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString('base64');
  
  try {
    const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
    
    if (!response.ok) {
      const errorResponse = await response.json();
      console.error('B2 authorization error:', errorResponse);
      throw new Error(`B2 authorization failed: ${errorResponse.message}`);
    }
    
    const data = await response.json();
    return {
      authorizationToken: data.authorizationToken,
      apiUrl: data.apiUrl,
      downloadUrl: data.downloadUrl
    };
  } catch (error) {
    console.error('Error getting B2 auth:', error);
    throw error;
  }
}

// Get upload URL and authentication token
async function getUploadUrl(authToken: string, apiUrl: string) {
  try {
    const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: B2_BUCKET_NAME
      })
    });
    
    if (!response.ok) {
      const errorResponse = await response.json();
      console.error('B2 get upload URL error:', errorResponse);
      throw new Error(`B2 get upload URL failed: ${errorResponse.message}`);
    }
    
    const data = await response.json();
    return {
      uploadUrl: data.uploadUrl,
      authorizationToken: data.authorizationToken
    };
  } catch (error) {
    console.error('Error getting B2 upload URL:', error);
    throw error;
  }
}

// Upload file to B2
async function uploadToB2(
  buffer: Buffer,
  fileName: string, 
  contentType: string,
  uploadUrl: string,
  authToken: string
) {
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'X-Bz-Content-Sha1': crypto.createHash('sha1').update(buffer).digest('hex')
      },
      body: buffer
    });
    
    if (!response.ok) {
      const errorResponse = await response.json();
      console.error('B2 upload error:', errorResponse);
      throw new Error(`B2 upload failed: ${errorResponse.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading to B2:', error);
    throw error;
  }
}

// Main function to upload a file to B2
export async function uploadFile(
  buffer: Buffer, 
  fileName: string, 
  contentType: string
): Promise<string> {
  try {
    // Step 1: Get authorization
    const auth = await getB2Auth();
    
    // Step 2: Get upload URL and token
    const uploadInfo = await getUploadUrl(auth.authorizationToken, auth.apiUrl);
    
    // Step 3: Upload the file
    const uploadResult = await uploadToB2(
      buffer,
      fileName,
      contentType,
      uploadInfo.uploadUrl,
      uploadInfo.authorizationToken
    );
    
    // Return the download URL
    return `${auth.downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}`;
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// List files in B2 bucket
export async function listFiles() {
  try {
    // Get authorization
    const auth = await getB2Auth();
    
    // List file names
    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        'Authorization': auth.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: B2_BUCKET_NAME,
        maxFileCount: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to list files: ${errorData.message}`);
    }
    
    const listFilesData = await response.json();
    return listFilesData.files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

// Delete a file from B2
export async function deleteFile(fileName: string) {
  try {
    // Get authorization
    const auth = await getB2Auth();
    
    // First get the file id
    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        'Authorization': auth.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: B2_BUCKET_NAME,
        prefix: fileName,
        maxFileCount: 1
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to find file: ${errorData.message}`);
    }
    
    const fileList = await response.json();
    if (fileList.files.length === 0) {
      throw new Error(`File not found: ${fileName}`);
    }
    
    const fileId = fileList.files[0].fileId;
    
    // Delete the file
    const deleteResponse = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
      method: 'POST',
      headers: {
        'Authorization': auth.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: fileId,
        fileName: fileName
      })
    });
    
    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(`Failed to delete file: ${errorData.message}`);
    }
    
    return await deleteResponse.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}