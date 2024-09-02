const { execSync } = require('child_process')

try {
  // Execute a command synchronously
  const output = execSync('ls -l', { encoding: 'utf-8' })

  // Print the output from the command
  console.log('Command Output:\n', output)
} catch (error) {
  // Handle errors if the command fails
  console.error('Error executing command:', error.message)
}
