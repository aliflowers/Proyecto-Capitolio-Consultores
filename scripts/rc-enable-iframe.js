// rc-enable-iframe.js - Enable iframe integration send/receive and set basic CORS for dev
try {
  const dbname = 'rocketchat';
  const s = db.getSiblingDB(dbname).getCollection('rocketchat_settings');
  function up(id, val) {
    s.updateOne({ _id: id }, { $set: { value: val } }, { upsert: true });
  }
  up('Iframe_Integration_receive_enable', true);
  up('Iframe_Integration_send_enable', true);
  print('OK');
} catch (e) {
  print('Error: ' + e.message);
}

