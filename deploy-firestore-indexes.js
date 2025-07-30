#!/usr/bin/env node

/**
 * Firestore Index Deployment Helper
 * 
 * This script helps deploy the required Firestore indexes for the Practice Drills Enhancement feature.
 * It provides multiple deployment options and validates the current configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔥 Firestore Index Deployment Helper');
console.log('=' .repeat(50));

// Check if firestore.indexes.json exists
function checkIndexConfiguration() {
  const indexFile = path.join(process.cwd(), 'firestore.indexes.json');
  
  if (!fs.existsSync(indexFile)) {
    console.log('❌ firestore.indexes.json not found');
    console.log('   Please ensure you are in the project root directory');
    return false;
  }
  
  try {
    const indexConfig = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    console.log('✅ firestore.indexes.json found');
    
    // Check for the required drills index
    const drillsIndex = indexConfig.indexes.find(index => 
      index.collectionGroup === 'drills' &&
      index.fields.some(field => field.fieldPath === 'userId') &&
      index.fields.some(field => field.fieldPath === 'createdAt')
    );
    
    if (drillsIndex) {
      console.log('✅ Required drills index configuration found');
      console.log('   Fields:', drillsIndex.fields.map(f => `${f.fieldPath} (${f.order})`).join(', '));
      return true;
    } else {
      console.log('❌ Required drills index configuration missing');
      return false;
    }
  } catch (error) {
    console.log('❌ Error reading firestore.indexes.json:', error.message);
    return false;
  }
}

// Check if Firebase CLI is available
function checkFirebaseCLI() {
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    console.log('✅ Firebase CLI available:', version);
    return true;
  } catch (error) {
    console.log('❌ Firebase CLI not found');
    console.log('   Install with: npm install -g firebase-tools');
    return false;
  }
}

// Check if user is logged in to Firebase
function checkFirebaseAuth() {
  try {
    const user = execSync('firebase auth:list', { encoding: 'utf8' });
    console.log('✅ Firebase authentication verified');
    return true;
  } catch (error) {
    console.log('❌ Firebase authentication required');
    console.log('   Login with: firebase login');
    return false;
  }
}

// Deploy indexes using Firebase CLI
function deployIndexes() {
  console.log('\n🚀 Deploying Firestore Indexes');
  console.log('-'.repeat(30));
  
  try {
    console.log('📤 Starting deployment...');
    const output = execSync('firebase deploy --only firestore:indexes', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Deployment completed successfully!');
    console.log('\n📋 Deployment Output:');
    console.log(output);
    
    console.log('\n⏰ Index Building Status:');
    console.log('   Indexes are now building in the background');
    console.log('   This process typically takes 5-10 minutes');
    console.log('   You can monitor progress in the Firebase Console');
    
    return true;
  } catch (error) {
    console.log('❌ Deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure you have the correct Firebase project selected');
    console.log('   2. Check your Firebase permissions');
    console.log('   3. Verify the firestore.indexes.json file is valid');
    return false;
  }
}

// Provide manual deployment instructions
function showManualInstructions() {
  console.log('\n📖 Manual Deployment Instructions');
  console.log('-'.repeat(40));
  
  console.log('\n🌐 Option 1: Firebase Console');
  console.log('1. Visit: https://console.firebase.google.com/project/ml-dojo-new/firestore/indexes');
  console.log('2. Click "Create Index"');
  console.log('3. Configure the index:');
  console.log('   - Collection ID: drills');
  console.log('   - Fields:');
  console.log('     • userId (Ascending)');
  console.log('     • createdAt (Descending)');
  console.log('   - Query Scope: Collection');
  console.log('4. Click "Create" and wait for completion');
  
  console.log('\n🔗 Option 2: Direct Link');
  console.log('Visit the error URL from the browser console:');
  console.log('https://console.firebase.google.com/v1/r/project/ml-dojo-new/firestore/indexes?create_composite=...');
  console.log('Click "Create Index" and wait for completion');
  
  console.log('\n⚡ Option 3: Firebase CLI (if available)');
  console.log('Run: firebase deploy --only firestore:indexes');
}

// Check deployment status
function checkDeploymentStatus() {
  console.log('\n📊 Checking Deployment Status');
  console.log('-'.repeat(30));
  
  try {
    // This would require Firebase Admin SDK to check index status
    // For now, provide instructions for manual checking
    console.log('📋 To check index status:');
    console.log('1. Visit Firebase Console: https://console.firebase.google.com/project/ml-dojo-new/firestore/indexes');
    console.log('2. Look for the drills index with fields: userId, createdAt');
    console.log('3. Status should show "Building" → "Enabled"');
    console.log('4. Once "Enabled", the application will use server-side sorting');
    
    console.log('\n🧪 Test the application:');
    console.log('1. Navigate to /drills page');
    console.log('2. Check browser console for performance improvements');
    console.log('3. Verify no Firestore errors appear');
    
  } catch (error) {
    console.log('❌ Unable to check status automatically');
    console.log('   Please check manually in Firebase Console');
  }
}

// Main deployment flow
function main() {
  console.log('🔍 Pre-deployment Checks');
  console.log('-'.repeat(25));
  
  // Check configuration
  if (!checkIndexConfiguration()) {
    console.log('\n❌ Configuration check failed');
    process.exit(1);
  }
  
  // Check Firebase CLI
  const hasFirebaseCLI = checkFirebaseCLI();
  
  if (hasFirebaseCLI) {
    // Check authentication
    const isAuthenticated = checkFirebaseAuth();
    
    if (isAuthenticated) {
      // Attempt automatic deployment
      console.log('\n🎯 Automatic Deployment Available');
      console.log('Would you like to deploy indexes automatically? (y/n)');
      
      // For automation, we'll proceed with deployment
      const success = deployIndexes();
      
      if (success) {
        checkDeploymentStatus();
        console.log('\n🎉 Deployment Process Complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. Wait 5-10 minutes for indexes to build');
        console.log('2. Test the application at /drills');
        console.log('3. Monitor Firebase Console for index status');
        console.log('4. Revert to optimized query once indexes are ready');
      } else {
        showManualInstructions();
      }
    } else {
      console.log('\n⚠️  Authentication required for automatic deployment');
      showManualInstructions();
    }
  } else {
    console.log('\n⚠️  Firebase CLI not available for automatic deployment');
    showManualInstructions();
  }
  
  console.log('\n📚 Additional Resources:');
  console.log('- Firebase Indexes Documentation: https://firebase.google.com/docs/firestore/query-data/indexing');
  console.log('- Troubleshooting Guide: See FIRESTORE_INDEX_DEPLOYMENT_FIX.md');
  console.log('- Critical Fixes Summary: See CRITICAL-FIXES-APPLIED.md');
}

// Handle command line execution
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    console.log('\n🆘 For help, see:');
    console.log('- FIRESTORE_INDEX_DEPLOYMENT_FIX.md');
    console.log('- CRITICAL-FIXES-APPLIED.md');
    process.exit(1);
  }
}

module.exports = {
  checkIndexConfiguration,
  checkFirebaseCLI,
  deployIndexes,
  showManualInstructions
};