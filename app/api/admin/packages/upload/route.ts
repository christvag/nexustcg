import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Check admin authentication
function checkAdminAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    if (decoded.role !== 'admin') {
      return { error: 'Forbidden - Admin access required', status: 403 };
    }

    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// Upload package image or icon
export async function POST(request: NextRequest) {
  const authResult = checkAdminAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'icon' or 'image'

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.'
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${type || 'package'}-${randomUUID()}${fileExtension}`;

    // Define storage path
    const storagePath = path.join(process.cwd(), 'storage', 'packages', uniqueFilename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(storagePath, buffer);

    // Return relative URL that can be stored in database
    const fileUrl = `/storage/packages/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: uniqueFilename
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete uploaded file
export async function DELETE(request: NextRequest) {
  const authResult = checkAdminAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ success: false, message: 'No filename provided' }, { status: 400 });
    }

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ success: false, message: 'Invalid filename' }, { status: 400 });
    }

    const fs = require('fs').promises;
    const filePath = path.join(process.cwd(), 'storage', 'packages', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'File not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
