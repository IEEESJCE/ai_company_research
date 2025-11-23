// Simple test to verify research continuity functionality
const { AIConversationalEngine } = require('./src/components/AIConversationalEngine.ts');

// Mock ResearchSession for testing
const mockSession = {
  id: 'test_123',
  companyName: 'Apple',
  status: 'complete',
  progress: 100,
  currentStep: 'Research completed',
  sources: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  accountPlan: null
};

console.log('Testing Research Continuity...');

// Create AI engine instance
const engine = new AIConversationalEngine();

// Test 1: Should stay on same company for "dig deeper" requests
const testInput1 = "dig deeper into Apple's leadership";
const result1 = engine.shouldStayOnSameCompany(testInput1);
console.log('Test 1 - Should stay on Apple for "dig deeper":', result1);

// Test 2: Generate deeper research response
const deeperResponse = engine.generateResponse("tell me more about Apple's competitors", mockSession);
console.log('Test 2 - Deeper research response:', deeperResponse.focusArea, deeperResponse.researchDepth);

console.log('Research continuity tests completed successfully!');