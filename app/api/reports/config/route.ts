import { NextResponse } from 'next/server';
import api from '@/services/api';

export async function GET() {
  try {
    const response = await api.get('/reports/config');
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching report config:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch report configuration',
        error: error.message
      },
      { status: error.response?.status || 500 }
    );
  }
} 