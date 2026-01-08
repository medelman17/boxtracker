import { createClient } from '@/lib/supabase';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {
    browserClient: { status: 'not_tested', data: null as any, error: null as any },
    serverClient: { status: 'not_tested', data: null as any, error: null as any },
    boxTypes: { status: 'not_tested', data: null as any, error: null as any },
    categories: { status: 'not_tested', data: null as any, error: null as any },
    timestamp: new Date().toISOString(),
  };

  // Test 1: Browser Client Connection
  try {
    const browserClient = createClient();
    const { data, error } = await browserClient
      .from('box_types')
      .select('id, name, code')
      .eq('is_default', true)
      .limit(1);

    if (error) {
      results.browserClient.status = 'error';
      results.browserClient.error = error.message;
    } else {
      results.browserClient.status = 'success';
      results.browserClient.data = data;
    }
  } catch (err) {
    results.browserClient.status = 'error';
    results.browserClient.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Test 2: Server Client Connection
  try {
    const serverClient = createServiceRoleClient();
    const { data, error } = await serverClient
      .from('box_types')
      .select('id, name, code')
      .eq('is_default', true)
      .limit(1);

    if (error) {
      results.serverClient.status = 'error';
      results.serverClient.error = error.message;
    } else {
      results.serverClient.status = 'success';
      results.serverClient.data = data;
    }
  } catch (err) {
    results.serverClient.status = 'error';
    results.serverClient.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Test 3: Query box_types (default data)
  try {
    const serverClient = createServiceRoleClient();
    const { data, error } = await serverClient
      .from('box_types')
      .select('id, name, code, is_default')
      .eq('is_default', true)
      .order('display_order');

    if (error) {
      results.boxTypes.status = 'error';
      results.boxTypes.error = error.message;
    } else {
      results.boxTypes.status = 'success';
      results.boxTypes.data = {
        count: data?.length ?? 0,
        types: data?.map((t) => ({ name: t.name, code: t.code })) ?? [],
      };
    }
  } catch (err) {
    results.boxTypes.status = 'error';
    results.boxTypes.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Test 4: Query categories (default data)
  try {
    const serverClient = createServiceRoleClient();
    const { data, error } = await serverClient
      .from('categories')
      .select('id, name, color, is_default')
      .eq('is_default', true)
      .order('display_order');

    if (error) {
      results.categories.status = 'error';
      results.categories.error = error.message;
    } else {
      results.categories.status = 'success';
      results.categories.data = {
        count: data?.length ?? 0,
        categories: data?.map((c) => ({ name: c.name, color: c.color })) ?? [],
      };
    }
  } catch (err) {
    results.categories.status = 'error';
    results.categories.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Determine overall status
  const allSuccessful =
    results.browserClient.status === 'success' &&
    results.serverClient.status === 'success' &&
    results.boxTypes.status === 'success' &&
    results.categories.status === 'success';

  const overallStatus = allSuccessful ? 'all_tests_passed' : 'some_tests_failed';

  return Response.json({
    status: overallStatus,
    results,
  });
}
