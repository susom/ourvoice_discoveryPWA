const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

// Instantiates a client
const client = new SecretManagerServiceClient();

// Gets the value of a secret
async function accessSecret() {
    const [version] = await client.accessSecretVersion({
        name: 'projects/696489330177/secrets/Discovery_Tool_PWA_env/versions/latest',
    });
    const value = version.payload.data.toString();
    console.log(`The value of my-secret is: ${value}`);
}

export default accessSecret;