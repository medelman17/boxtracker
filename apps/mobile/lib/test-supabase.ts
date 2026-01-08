import { supabase } from './supabase';

export interface TestResults {
  status: 'all_tests_passed' | 'some_tests_failed' | 'error';
  results: {
    connection: { status: string; data: any; error: any };
    boxTypes: { status: string; data: any; error: any };
    categories: { status: string; data: any; error: any };
  };
  timestamp: string;
}

export async function testSupabaseConnection(): Promise<TestResults> {
  const results = {
    connection: { status: 'not_tested', data: null as any, error: null as any },
    boxTypes: { status: 'not_tested', data: null as any, error: null as any },
    categories: { status: 'not_tested', data: null as any, error: null as any },
    timestamp: new Date().toISOString(),
  };

  // Test 1: Basic Connection
  try {
    const { data, error } = await supabase
      .from('box_types')
      .select('id, name, code')
      .eq('is_default', true)
      .limit(1);

    if (error) {
      results.connection.status = 'error';
      results.connection.error = error.message;
    } else {
      results.connection.status = 'success';
      results.connection.data = data;
    }
  } catch (err) {
    results.connection.status = 'error';
    results.connection.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Test 2: Query box_types (default data)
  try {
    const { data, error } = await supabase
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

  // Test 3: Query categories (default data)
  try {
    const { data, error } = await supabase
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
    results.connection.status === 'success' &&
    results.boxTypes.status === 'success' &&
    results.categories.status === 'success';

  const overallStatus = allSuccessful ? 'all_tests_passed' : 'some_tests_failed';

  return {
    status: overallStatus,
    results,
    timestamp: results.timestamp,
  };
}
