import { S3Client } from '@aws-sdk/client-s3';

const endpoint = process.env.S3_ENDPOINT || 'https://vvfyrmokhzekpxwqdixg.storage.supabase.co/storage/v1/s3';
const region = process.env.S3_REGION || 'ap-southeast-1';
const accessKeyId = process.env.S3_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';

export function createS3Client(): S3Client {
	return new S3Client({
		region,
		endpoint,
		forcePathStyle: true,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});
}

export const DEFAULT_BACKUP_BUCKET = process.env.S3_BUCKET || 'backups';


