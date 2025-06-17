import CryptoJS from 'crypto-js';

class ACRCloudService {
  constructor(config) {
    this.host = config.host;
    this.accessKey = config.accessKey;
    this.accessSecret = config.accessSecret;
    this.dataType = config.dataType || 'audio';
    this.signatureVersion = config.signatureVersion || '1';
  }

  buildStringToSign(method, uri, httpMethod, signatureVersion, timestamp) {
    let signString = null;
    if (signatureVersion === '1') {
      signString = `${method}\n${uri}\n${this.accessKey}\n${this.dataType}\n${signatureVersion}\n${timestamp}`;
    }
    return signString;
  }

  sign(signString) {
    const signature = CryptoJS.HmacSHA1(signString, this.accessSecret);
    return CryptoJS.enc.Base64.stringify(signature);
  }

  async identify(audioData) {
    console.log('[ACRCloudService] Starting identification...');
    const currentDate = new Date();
    const timestamp = Math.floor(currentDate.getTime() / 1000);
    console.log('[ACRCloudService] Timestamp:', timestamp);
    
    const stringToSign = this.buildStringToSign(
      'POST',
      '/v1/identify',
      'POST',
      this.signatureVersion,
      timestamp
    );
    console.log('[ACRCloudService] String to sign:', stringToSign);
    
    const signature = this.sign(stringToSign);
    console.log('[ACRCloudService] Generated signature:', signature);
    
    const formData = new FormData();
    formData.append('sample', audioData);
    formData.append('access_key', this.accessKey);
    formData.append('data_type', this.dataType);
    formData.append('signature_version', this.signatureVersion);
    formData.append('signature', signature);
    formData.append('sample_bytes', audioData.size || audioData.length);
    formData.append('timestamp', timestamp);
    
    console.log('[ACRCloudService] FormData prepared with:');
    console.log('  - access_key:', this.accessKey);
    console.log('  - data_type:', this.dataType);
    console.log('  - sample_bytes:', audioData.size || audioData.length);
    console.log('  - host:', this.host);
    
    try {
      const url = `https://${this.host}/v1/identify`;
      console.log('[ACRCloudService] Sending POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      console.log('[ACRCloudService] Response status:', response.status);
      console.log('[ACRCloudService] Response headers:', response.headers);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[ACRCloudService] Error response body:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      
      const result = await response.json();
      console.log('[ACRCloudService] Identification result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[ACRCloudService] Identification error:', error);
      console.error('[ACRCloudService] Error stack:', error.stack);
      throw error;
    }
  }

  async identifyFile(audioFile, fileSize) {
    console.log('[ACRCloudService] Starting file identification...');
    const currentDate = new Date();
    const timestamp = Math.floor(currentDate.getTime() / 1000);
    console.log('[ACRCloudService] Timestamp:', timestamp);
    console.log('[ACRCloudService] File size:', fileSize);
    
    const stringToSign = this.buildStringToSign(
      'POST',
      '/v1/identify',
      'POST',
      this.signatureVersion,
      timestamp
    );
    console.log('[ACRCloudService] String to sign:', stringToSign);
    
    const signature = this.sign(stringToSign);
    console.log('[ACRCloudService] Generated signature:', signature);
    
    const formData = new FormData();
    formData.append('sample', audioFile);
    formData.append('access_key', this.accessKey);
    formData.append('data_type', this.dataType);
    formData.append('signature_version', this.signatureVersion);
    formData.append('signature', signature);
    formData.append('sample_bytes', fileSize);
    formData.append('timestamp', timestamp);
    
    console.log('[ACRCloudService] FormData prepared with:');
    console.log('  - access_key:', this.accessKey);
    console.log('  - data_type:', this.dataType);
    console.log('  - sample_bytes:', fileSize);
    console.log('  - host:', this.host);
    console.log('  - file:', audioFile);
    
    try {
      const url = `https://${this.host}/v1/identify`;
      console.log('[ACRCloudService] Sending POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      console.log('[ACRCloudService] Response status:', response.status);
      console.log('[ACRCloudService] Response headers:', response.headers);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[ACRCloudService] Error response body:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      
      const result = await response.json();
      console.log('[ACRCloudService] Identification result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[ACRCloudService] Identification error:', error);
      console.error('[ACRCloudService] Error stack:', error.stack);
      throw error;
    }
  }

  async identifyBase64(base64Audio) {
    console.log('[ACRCloudService] Starting base64 identification...');
    const currentDate = new Date();
    const timestamp = Math.floor(currentDate.getTime() / 1000);
    console.log('[ACRCloudService] Timestamp:', timestamp);
    
    // Calculate approximate size (base64 is ~33% larger than binary)
    const sampleBytes = Math.floor((base64Audio.length * 3) / 4);
    console.log('[ACRCloudService] Approximate sample bytes:', sampleBytes);
    
    const stringToSign = this.buildStringToSign(
      'POST',
      '/v1/identify',
      'POST',
      this.signatureVersion,
      timestamp
    );
    console.log('[ACRCloudService] String to sign:', stringToSign);
    
    const signature = this.sign(stringToSign);
    console.log('[ACRCloudService] Generated signature:', signature);
    
    // Create form data with base64 string directly
    const formData = new FormData();
    
    // Create a file-like object from base64
    const blob = {
      uri: `data:audio/mp4;base64,${base64Audio}`,
      type: 'audio/mp4',
      name: 'audio.mp4'
    };
    
    formData.append('sample', blob);
    formData.append('access_key', this.accessKey);
    formData.append('data_type', this.dataType);
    formData.append('signature_version', this.signatureVersion);
    formData.append('signature', signature);
    formData.append('sample_bytes', sampleBytes);
    formData.append('timestamp', timestamp);
    
    console.log('[ACRCloudService] FormData prepared with:');
    console.log('  - access_key:', this.accessKey);
    console.log('  - data_type:', this.dataType);
    console.log('  - sample_bytes:', sampleBytes);
    console.log('  - host:', this.host);
    
    try {
      const url = `https://${this.host}/v1/identify`;
      console.log('[ACRCloudService] Sending POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      console.log('[ACRCloudService] Response status:', response.status);
      console.log('[ACRCloudService] Response headers:', response.headers);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[ACRCloudService] Error response body:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      
      const result = await response.json();
      console.log('[ACRCloudService] Identification result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[ACRCloudService] Identification error:', error);
      console.error('[ACRCloudService] Error stack:', error.stack);
      throw error;
    }
  }

  async identifyByFileId(fileId, fileType = 'audio') {
    const currentDate = new Date();
    const timestamp = Math.floor(currentDate.getTime() / 1000);
    
    const stringToSign = this.buildStringToSign(
      'GET',
      '/v1/monitor-streams/' + fileId + '/results',
      'GET',
      this.signatureVersion,
      timestamp
    );
    
    const signature = this.sign(stringToSign);
    
    const params = new URLSearchParams({
      access_key: this.accessKey,
      signature_version: this.signatureVersion,
      signature: signature,
      timestamp: timestamp
    });
    
    try {
      const response = await fetch(`https://${this.host}/v1/monitor-streams/${fileId}/results?${params}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ACRCloud file identification error:', error);
      throw error;
    }
  }
}

export default ACRCloudService;