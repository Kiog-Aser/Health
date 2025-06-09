import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, type } = await request.json();

    if (!connectionString || !type) {
      return NextResponse.json(
        { error: 'Connection string and type are required' },
        { status: 400 }
      );
    }

    // For security, we'll validate the connection string format
    if (type === 'postgresql') {
      if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
        return NextResponse.json(
          { error: 'Invalid PostgreSQL connection string format' },
          { status: 400 }
        );
      }
    }

    // Test real PostgreSQL connection
    if (type === 'postgresql') {
      const client = new Client({
        connectionString,
        connectionTimeoutMillis: 5000, // 5 second timeout
      });

      try {
        await client.connect();
        
        // Test with a simple query
        await client.query('SELECT NOW()');
        
        await client.end();
        
        console.log('PostgreSQL connection test successful');
        return NextResponse.json({ 
          success: true, 
          message: 'PostgreSQL connection successful',
          type 
        });
      } catch (dbError) {
        console.error('PostgreSQL connection failed:', dbError);
        
        try {
          await client.end();
        } catch (endError) {
          // Ignore cleanup errors
        }
        
        return NextResponse.json(
          { error: 'Database connection failed. Please check your connection string.' },
          { status: 400 }
        );
      }
    }

    // For other database types, return not supported for now
    return NextResponse.json(
      { error: 'Database type not supported yet' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Connection test failed' },
      { status: 500 }
    );
  }
} 