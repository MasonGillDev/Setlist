// ACRCloud configuration
export const ACRCloudConfig = {
  host: "identify-us-west-2.acrcloud.com",
  accessKey: "fb227893b777ab0121d927ac17cd4bd5",
  accessSecret: "ScNgi45jf3LE1X4nFTRFdYN3PvQyoPrAH3kYJq9j",
  dataType: "audio",
  signatureVersion: "1",
};

// Usage example:
// import ACRCloudService from '../services/ACRCloudService';
// import { ACRCloudConfig } from '../config/acrcloud';
//
// const acrService = new ACRCloudService(ACRCloudConfig);
// const result = await acrService.identify(audioBlob);
