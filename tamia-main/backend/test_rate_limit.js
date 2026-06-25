async function testRateLimit() {
  let successCount = 0;
  let tooManyCount = 0;
  for (let i = 1; i <= 65; i++) {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/categories');
      if (res.status === 200) {
        successCount++;
        console.log(`Request ${i}: OK (200)`);
      } else if (res.status === 429) {
        tooManyCount++;
        console.log(`Request ${i}: Too Many Requests (429)`);
      } else {
        console.log(`Request ${i}: HTTP ${res.status}`);
      }
    } catch (err) {
      console.log(`Request ${i}: Failed - ${err.message}`);
    }
  }
  console.log(`\nSummary: \nSuccess (200): ${successCount}\nRate Limited (429): ${tooManyCount}`);
}
testRateLimit();
