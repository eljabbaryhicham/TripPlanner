
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'email-template.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(data);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read email template:', error);
    // Return a default template if the file doesn't exist
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const defaultTemplate = `<h3>New Booking Inquiry for {{serviceName}}</h3>
<p><strong>Name:</strong> {{name}}</p>
<p><strong>Email:</strong> {{email}}</p>`;
      return NextResponse.json({ template: defaultTemplate });
    }
    return NextResponse.json({ error: 'Could not load email template.' }, { status: 500 });
  }
}
