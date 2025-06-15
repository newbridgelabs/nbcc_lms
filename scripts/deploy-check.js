#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 NBCC Sermon Q&A System - Deployment Readiness Check\n')

// Check 1: Package.json has correct scripts
console.log('1. Checking package.json...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredScripts = ['dev', 'build', 'start']
  const hasAllScripts = requiredScripts.every(script => packageJson.scripts[script])
  
  if (hasAllScripts) {
    console.log('   ✅ All required scripts present')
  } else {
    console.log('   ❌ Missing required scripts')
    console.log('   Required: dev, build, start')
  }
} catch (error) {
  console.log('   ❌ Error reading package.json')
}

// Check 2: Environment variables template
console.log('\n2. Checking environment setup...')
if (fs.existsSync('.env.local')) {
  console.log('   ✅ .env.local exists (for local development)')
} else {
  console.log('   ⚠️  .env.local not found (create for local development)')
}

if (fs.existsSync('.env.example')) {
  console.log('   ✅ .env.example exists')
} else {
  console.log('   ⚠️  .env.example not found (recommended for documentation)')
}

// Check 3: Required files for deployment
console.log('\n3. Checking deployment files...')
const requiredFiles = [
  'next.config.js',
  'tailwind.config.js',
  'vercel.json'
]

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`)
  } else {
    console.log(`   ⚠️  ${file} not found`)
  }
})

// Check 4: SQL setup file
console.log('\n4. Checking database setup...')
if (fs.existsSync('sql/complete_sermon_setup.sql')) {
  console.log('   ✅ Database setup SQL file exists')
} else {
  console.log('   ❌ Database setup SQL file missing')
}

// Check 5: Key directories
console.log('\n5. Checking project structure...')
const requiredDirs = [
  'pages',
  'pages/api',
  'pages/admin',
  'components',
  'lib',
  'styles'
]

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir}/ directory exists`)
  } else {
    console.log(`   ❌ ${dir}/ directory missing`)
  }
})

// Check 6: Dependencies
console.log('\n6. Checking key dependencies...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const keyDeps = [
    'next',
    'react',
    '@supabase/supabase-js',
    'tailwindcss'
  ]
  
  keyDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`   ✅ ${dep} installed`)
    } else {
      console.log(`   ❌ ${dep} missing`)
    }
  })
} catch (error) {
  console.log('   ❌ Error checking dependencies')
}

console.log('\n📋 Deployment Checklist:')
console.log('   □ Run this check script')
console.log('   □ Commit all changes to GitHub')
console.log('   □ Set up Supabase project')
console.log('   □ Run SQL setup in Supabase')
console.log('   □ Create Vercel account')
console.log('   □ Import GitHub repo to Vercel')
console.log('   □ Set environment variables in Vercel')
console.log('   □ Deploy and test')

console.log('\n🔗 Quick Links:')
console.log('   • Vercel: https://vercel.com')
console.log('   • Supabase: https://supabase.com')
console.log('   • Deployment Guide: ./DEPLOYMENT.md')

console.log('\n🎉 Ready to deploy your NBCC Sermon Q&A System!')
