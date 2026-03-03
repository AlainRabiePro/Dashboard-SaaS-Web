// Helper pour importer node-ssh dynamiquement au runtime
export async function getSSHClient() {
  const { NodeSSH } = require('node-ssh');
  return new NodeSSH();
}
