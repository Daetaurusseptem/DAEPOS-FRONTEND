import { execSync } from 'child_process';

async function globalSetup() {
  console.log('🌱 Ejecutando Seed V3 para preparar la base de datos de pruebas...');
  try {
    // Esto corre el comando "npm run seed" en la carpeta del backend
    execSync('npm run seed', { cwd: '../backend', stdio: 'inherit' });
    console.log('✅ Base de datos de pruebas lista.');
  } catch (error) {
    console.error('❌ Error al ejecutar el seed. Asegúrate de que MongoDB esté corriendo.', error);
    throw error;
  }
}

export default globalSetup;
