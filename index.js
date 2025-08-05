const { startProducer } = require('./producer');
const { startConsumer } = require('./consumer');

startProducer().catch(err => {
  console.error('Fatal producer error:', err);
  process.exit(1);
});

startConsumer().catch(err => {
  console.error('Fatal consumer error:', err);
  process.exit(1);
});