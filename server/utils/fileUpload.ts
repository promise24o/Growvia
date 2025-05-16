import { randomUUID } from 'crypto';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Backblaze B2 Configuration
const B2_BUCKET_NAME = 'growvia';
const B2_KEY_ID = '0035a5bf5b3643e0000000001';
const B2_APPLICATION_KEY = 'K003TweGSMtFweosBTYP/GWXw0VMS04';
const B2_API_URL = 'https://api.backblazeb2.com';

// Authenticate with B2 and get auth token and API URL
async function authorizeB2() {
  try {
    const authorizationHeader = `Basic ${Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString('base64')}`;
    
    const response = await fetch(`${B2_API_URL}/b2api/v2/b2_authorize_account`, {
      headers: {
        Authorization: authorizationHeader
      }
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`B2 authorization failed: ${errorResponse.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      authorizationToken: data.authorizationToken,
      apiUrl: data.apiUrl,
      downloadUrl: data.downloadUrl
    };
  } catch (error) {
    console.error('B2 Authorization Error:', error);
    throw error;
  }
}

// Get an upload URL for B2
async function getUploadUrl(authToken: string, apiUrl: string) {
  try {
    const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: B2_BUCKET_NAME
      })
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`Failed to get upload URL: ${errorResponse.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      uploadUrl: data.uploadUrl,
      authorizationToken: data.authorizationToken
    };
  } catch (error) {
    console.error('B2 Get Upload URL Error:', error);
    throw error;
  }
}

// Upload file to B2
async function uploadFileToB2(uploadUrl: string, authToken: string, fileBuffer: Buffer, fileName: string, contentType: string) {
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': contentType,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'X-Bz-Content-Sha1': 'do_not_verify', // For simplicity, we're skipping SHA1 verification
        'X-Bz-Info-Author': 'Growvia'
      },
      body: fileBuffer
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`File upload failed: ${errorResponse.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('B2 Upload Error:', error);
    throw error;
  }
}

// Save temp file locally before upload
async function saveTempFile(buffer: Buffer, originalName: string): Promise<string> {
  const tempDir = os.tmpdir();
  const uniqueName = `${randomUUID()}-${originalName}`;
  const filePath = path.join(tempDir, uniqueName);
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(filePath);
    });
  });
}

// Main function to upload file
export async function uploadFile(fileBuffer: Buffer, originalFilename: string, contentType: string): Promise<string> {
  try {
    // Generate a unique filename
    const fileExtension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, fileExtension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFileName = `${sanitizedBaseName}-${randomUUID()}${fileExtension}`;
    
    // Authorize with B2
    const authData = await authorizeB2();
    
    // Get upload URL
    const uploadUrlData = await getUploadUrl(authData.authorizationToken, authData.apiUrl);
    
    // Upload file to B2
    const uploadResult = await uploadFileToB2(
      uploadUrlData.uploadUrl,
      uploadUrlData.authorizationToken,
      fileBuffer,
      uniqueFileName,
      contentType
    );
    
    // Return the file URL
    return `${authData.downloadUrl}/file/${B2_BUCKET_NAME}/${uniqueFileName}`;
  } catch (error) {
    console.error('File Upload Error:', error);
    throw error;
  }
}

// Delete file from B2
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // Extract file name from URL
    const fileName = fileUrl.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid file URL');
    }
    
    // Authorize with B2
    const authData = await authorizeB2();
    
    // List file versions to get file ID
    const listFilesResponse = await fetch(
      `${authData.apiUrl}/b2api/v2/b2_list_file_names`,
      {
        method: 'POST',
        headers: {
          Authorization: authData.authorizationToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucketId: B2_BUCKET_NAME,
          startFileName: fileName,
          maxFileCount: 1
        })
      }
    );
    
    if (!listFilesResponse.ok) {
      const errorData = await listFilesResponse.json();
      throw new Error(`Failed to list files: ${errorData.message || listFilesResponse.statusText}`);
    }
    
    const listFilesData = await listFilesResponse.json();
    const file = listFilesData.files.find((f: any) => f.fileName === fileName);
    
    if (!file) {
      return false; // File not found
    }
    
    // Delete file
    const deleteResponse = await fetch(
      `${authData.apiUrl}/b2api/v2/b2_delete_file_version`,
      {
        method: 'POST',
        headers: {
          Authorization: authData.authorizationToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.fileName,
          fileId: file.fileId
        })
      }
    );
    
    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(`Failed to delete file: ${errorData.message || deleteResponse.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('File Delete Error:', error);
    return false;
  }
}