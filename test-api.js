// Simple test to verify Tavily API key is working
const testTavily = async () => {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: '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',
        query: 'Tesla Inc company overview',
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: 3,
        include_domains: [],
        exclude_domains: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Tavily API is working!');
    console.log('Results found:', data.results.length);
    console.log('First result:', data.results[0]?.title);

    return data;
  } catch (error) {
    console.error('❌ Tavily API test failed:', error.message);
    return null;
  }
};

testTavily();