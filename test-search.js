// Test script to verify Tavily API functionality
const TavilyClient = require('./src/lib/tavilyClient').tavilyClient;

async function testSearch() {
  console.log('Testing Tavily API with provided key...');

  try {
    // Test basic search
    console.log('Testing basic search...');
    const result = await tavilyClient.search('Microsoft company overview', 3);
    console.log('Search results:', JSON.stringify(result, null, 2));

    // Test company info search
    console.log('\nTesting company info search...');
    const companyInfo = await tavilyClient.searchCompanyInfo('Apple');
    console.log('Company info results:', companyInfo.length, 'sources found');
    console.log('First result:', JSON.stringify(companyInfo[0], null, 2));

    console.log('\n✅ API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('Full error:', error);
  }
}

testSearch();