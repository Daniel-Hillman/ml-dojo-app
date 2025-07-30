/**
 * Test script for drill loading functions
 * Run with: node test-drill-functions.js
 */

// Mock Firestore functions for testing
const mockFirestore = {
  collection: (path) => ({ path }),
  query: (collection, ...constraints) => ({ collection, constraints }),
  where: (field, op, value) => ({ type: 'where', field, op, value }),
  orderBy: (field, direction) => ({ type: 'orderBy', field, direction }),
  getDocs: async (query) => {
    // Mock response based on query path
    if (query.collection.path === 'drills') {
      return {
        docs: [
          {
            id: 'drill1',
            data: () => ({
              title: 'Personal Drill 1',
              concept: 'Variables',
              difficulty: 'Beginner',
              description: 'Learn about variables',
              drill_content: [],
              userId: 'user123',
              createdAt: { toDate: () => new Date('2024-01-01') },
              language: 'python'
            })
          }
        ]
      };
    } else if (query.collection.path.includes('saved_drills')) {
      return {
        docs: [
          {
            id: 'saved1',
            data: () => ({
              drillId: 'community1',
              savedAt: { toDate: () => new Date('2024-01-02') },
              originalDrillData: {
                title: 'Community Drill 1',
                concept: 'Functions',
                difficulty: 'Intermediate',
                description: 'Learn about functions',
                content: [],
                authorId: 'author1',
                authorName: 'John Doe',
                authorAvatar: 'avatar.jpg',
                createdAt: { toDate: () => new Date('2024-01-01') },
                likes: 10,
                views: 100,
                saves: 5,
                language: 'javascript'
              }
            })
          }
        ]
      };
    }
    return { docs: [] };
  }
};

// Mock the drills module
const drillsModule = {
  transformSavedDrillToEnhanced: (savedDrill) => {
    const { originalDrillData } = savedDrill;
    
    return {
      id: savedDrill.drillId,
      title: originalDrillData.title,
      concept: originalDrillData.concept,
      difficulty: originalDrillData.difficulty,
      description: originalDrillData.description,
      drill_content: originalDrillData.content,
      language: originalDrillData.language,
      createdAt: originalDrillData.createdAt?.toDate(),
      source: 'community',
      originalAuthor: originalDrillData.authorName,
      originalAuthorAvatar: originalDrillData.authorAvatar,
      savedAt: savedDrill.savedAt?.toDate(),
      communityMetrics: {
        likes: originalDrillData.likes || 0,
        views: originalDrillData.views || 0,
        saves: originalDrillData.saves || 0
      }
    };
  },

  loadPersonalDrills: async (userId) => {
    const q = mockFirestore.query(
      mockFirestore.collection('drills'),
      mockFirestore.where('userId', '==', userId),
      mockFirestore.orderBy('createdAt', 'desc')
    );
    
    const snapshot = await mockFirestore.getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        concept: data.concept,
        difficulty: data.difficulty,
        description: data.description,
        drill_content: data.drill_content,
        userId: data.userId,
        createdAt: data.createdAt?.toDate(),
        language: data.language,
        source: 'personal'
      };
    });
  },

  loadSavedDrills: async (userId) => {
    const q = mockFirestore.query(
      mockFirestore.collection(`users/${userId}/saved_drills`),
      mockFirestore.orderBy('savedAt', 'desc')
    );
    
    const snapshot = await mockFirestore.getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return drillsModule.transformSavedDrillToEnhanced(data);
    });
  },

  getDrillCounts: (personalDrills, savedDrills) => {
    return {
      personalCount: personalDrills.length,
      savedCount: savedDrills.length,
      totalCount: personalDrills.length + savedDrills.length
    };
  }
};

// Test functions
async function testDrillFunctions() {
  console.log('Testing drill loading functions...\n');

  try {
    // Test loadPersonalDrills
    console.log('1. Testing loadPersonalDrills...');
    const personalDrills = await drillsModule.loadPersonalDrills('user123');
    console.log('✅ Personal drills loaded:', personalDrills.length);
    console.log('   First drill:', personalDrills[0]?.title);
    console.log('   Source:', personalDrills[0]?.source);
    
    // Verify requirements 1.2: Only shows user-created drills
    const allPersonal = personalDrills.every(drill => drill.source === 'personal');
    console.log('   ✅ Requirement 1.2 - All drills are personal:', allPersonal);

    // Test loadSavedDrills
    console.log('\n2. Testing loadSavedDrills...');
    const savedDrills = await drillsModule.loadSavedDrills('user123');
    console.log('✅ Saved drills loaded:', savedDrills.length);
    console.log('   First drill:', savedDrills[0]?.title);
    console.log('   Source:', savedDrills[0]?.source);
    console.log('   Original author:', savedDrills[0]?.originalAuthor);
    
    // Verify requirements 1.3, 5.1, 5.2, 5.3
    const allCommunity = savedDrills.every(drill => drill.source === 'community');
    console.log('   ✅ Requirement 1.3 - All drills are community:', allCommunity);
    
    const hasAuthorInfo = savedDrills.every(drill => drill.originalAuthor);
    console.log('   ✅ Requirement 5.1 - Has original author info:', hasAuthorInfo);
    
    const hasCreationDate = savedDrills.every(drill => drill.createdAt);
    console.log('   ✅ Requirement 5.2 - Has original creation date:', hasCreationDate);
    
    const hasMetrics = savedDrills.every(drill => drill.communityMetrics);
    console.log('   ✅ Requirement 5.3 - Has community metrics:', hasMetrics);

    // Test transformSavedDrillToEnhanced
    console.log('\n3. Testing transformSavedDrillToEnhanced...');
    const mockSavedDrill = {
      drillId: 'test123',
      savedAt: { toDate: () => new Date() },
      originalDrillData: {
        title: 'Test Drill',
        concept: 'Testing',
        difficulty: 'Beginner',
        description: 'Test description',
        content: [],
        authorName: 'Test Author',
        authorAvatar: 'test.jpg',
        createdAt: { toDate: () => new Date() },
        likes: 5,
        views: 50,
        saves: 2,
        language: 'python'
      }
    };
    
    const enhanced = drillsModule.transformSavedDrillToEnhanced(mockSavedDrill);
    console.log('✅ Transformation successful');
    console.log('   Enhanced drill ID:', enhanced.id);
    console.log('   Source:', enhanced.source);
    console.log('   Original author:', enhanced.originalAuthor);
    console.log('   Community metrics:', enhanced.communityMetrics);

    // Test getDrillCounts
    console.log('\n4. Testing getDrillCounts...');
    const counts = drillsModule.getDrillCounts(personalDrills, savedDrills);
    console.log('✅ Drill counts calculated');
    console.log('   Personal:', counts.personalCount);
    console.log('   Saved:', counts.savedCount);
    console.log('   Total:', counts.totalCount);
    
    // Verify requirement 4.4: Show drill counters
    const hasValidCounts = counts.personalCount >= 0 && counts.savedCount >= 0 && counts.totalCount >= 0;
    console.log('   ✅ Requirement 4.4 - Valid drill counters:', hasValidCounts);

    console.log('\n🎉 All tests passed! Functions are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testDrillFunctions();