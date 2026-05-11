import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// id: api-admin-upload-001
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

export const dynamic = 'force-dynamic'

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']

function checkAdminAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Unauthorized', status: 401 }

  try {
    const decoded = verify(token, JWT_SECRET) as any
    if (decoded.role !== 'admin') return { error: 'Forbidden', status: 403 }
    return { user: decoded }
  } catch {
    return { error: 'Invalid token', status: 401 }
  }
}

// POST - Upload a file
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'packages' // 'packages', 'icons', etc.

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed: PNG, JPG, JPEG, WebP, SVG` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size: 5MB` },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${timestamp}-${randomStr}.${ext}`
    const filepath = path.join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/${type}/${filename}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type
    })
  } catch (error: any) {
    console.error('[API /api/admin/upload] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
