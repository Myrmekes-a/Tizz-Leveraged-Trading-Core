import { loadPackageDefinition, credentials } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { PROTO_PATH } from '../config';

class PullServiceClient {
  constructor(address) {
    const packageDefinition = loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const pullProto = loadPackageDefinition(packageDefinition).pull_service;
    this.client = new pullProto.PullService(address, credentials.createSsl());
  }

  getProof(request, callback) {
    this.client.getProof(request, callback);
  }
}

export default PullServiceClient;
