
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'client-email-template.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(data);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read client email template:', error);
    // Return a default template if the file doesn't exist
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const defaultTemplate = `<h3>Confirmation for {{serviceName}}</h3><p>Hi {{name}},</p><p>We have received your inquiry and will get back to you soon.</p>`;
      return NextResponse.json({ template: defaultTemplate });
    }
    return NextResponse.json({ error: 'Could not load client email template.' }, { status: 500 });
  }
}
