const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
app.use(express.json()); // For parsing JSON request bodies

const configPath = '/etc/wireguard/wg0.conf'; // Adjust the path to your WireGuard config

// Endpoint to add a new peer
app.post('/add-peer', (req, res) => {
  const { publicKey, privateKey, ip } = req.body;

  if (!publicKey || !privateKey || !ip) {
    return res.status(400).json({ error: 'publicKey, privateKey, and ip are required.' });
  }

  // Create the peer configuration block
  const peerConfig = `
[Peer]
PublicKey = ${publicKey}
AllowedIPs = ${ip}/32`;

  // Append the new peer to the configuration file
  fs.appendFile(configPath, peerConfig, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to write to config file.' });
    }

    // Restart the WireGuard service
    exec('sudo systemctl restart wg-quick@wg0.service', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: `Failed to restart WireGuard: ${stderr}` });
      }

      res.status(200).json({ message: 'Peer added successfully and WireGuard restarted.' });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
