
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(data);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read settings:', error);
    return NextResponse.json({ error: 'Could not load settings.' }, { status: 500 });
  }
}
