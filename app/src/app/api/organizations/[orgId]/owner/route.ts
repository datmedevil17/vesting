import { NextRequest, NextResponse } from 'next/server';
import { isOrganizationOwner } from '@/services';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;
    const { publicKey } = await request.json();
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      );
    }
    
    const isOwner = await isOrganizationOwner(orgId, publicKey);
    
    return NextResponse.json({ isOwner });
  } catch (error) {
    console.error('Error checking organization owner:', error);
    return NextResponse.json(
      { error: 'Failed to check organization owner' },
      { status: 500 }
    );
  }
}