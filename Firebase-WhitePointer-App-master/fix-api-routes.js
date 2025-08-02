const fs = require('fs');
const path = require('path');

// List of files to update based on the grep search results
const filesToFix = [
  'src/app/api/workspaces/[id]/route.ts',
  'src/app/api/signature/rental-details/[caseId]/route.ts',
  'src/app/api/forms/claims/[token]/submit/route.ts',
  'src/app/api/forms/claims/[token]/route.ts',
  'src/app/api/forms/claims/[token]/draft/route.ts',
  'src/app/api/forms/authority/[token]/submit/route.ts',
  'src/app/api/forms/authority/[token]/route.ts',
  'src/app/api/forms/authority/[token]/draft/route.ts',
  'src/app/api/bikes/[id]/route.ts',
  'src/app/api/cases/[id]/route.ts',
  'src/app/api/cases/[id]/delete/route.ts',
  'src/app/api/cases/by-number/[caseNumber]/route.ts'
];

// Root directory
const rootDir = __dirname;

// Process each file
filesToFix.forEach(relativeFilePath => {
  const filePath = path.join(rootDir, relativeFilePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace Promise-wrapped params pattern with the correct context pattern
  content = content.replace(
    /\{\s*params\s*\}:\s*\{\s*params:\s*Promise<([^>]+)>\s*\}/g, 
    'context: { params: $1 }'
  );
  
  // Add extraction of params from context
  content = content.replace(
    /(\s*)(const|let|var)?\s*\{\s*token\s*\}\s*=\s*await\s*params;/g,
    '$1const { token } = context.params;'
  );
  
  content = content.replace(
    /(\s*)(const|let|var)?\s*\{\s*id\s*\}\s*=\s*await\s*params;/g,
    '$1const { id } = context.params;'
  );
  
  content = content.replace(
    /(\s*)(const|let|var)?\s*\{\s*caseId\s*\}\s*=\s*await\s*params;/g,
    '$1const { caseId } = context.params;'
  );
  
  content = content.replace(
    /(\s*)(const|let|var)?\s*\{\s*caseNumber\s*\}\s*=\s*await\s*params;/g,
    '$1const { caseNumber } = context.params;'
  );
  
  // Write updated content back to file
  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${filePath}`);
});

console.log('API route fixes completed!');
