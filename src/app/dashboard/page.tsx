'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, Database } from '@/utils/supabase';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useRouter } from 'next/navigation';

type Expense = Database['public']['Tables']['expenses']['Row'];

export default function DashboardPage() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      // TEMP: Auth disabled - fetching all expenses
      // .eq('user_id', user?.id)
      .gte('date', start.toISOString())
      .lte('date', end.toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(data || []);
    }
    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 
              onClick={() => {
                setSelectedDate(new Date());
                router.push('/dashboard');
              }}
              className="text-2xl font-semibold text-gray-900 cursor-pointer 
                hover:text-indigo-600 transition-colors duration-200"
            >
              Penny Journal
            </h1>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm text-gray-600 rounded-md
                transition-all duration-200 ease-in-out cursor-pointer
                hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm
                active:bg-gray-200 active:scale-95"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-full cursor-pointer
              transition-all duration-200 ease-in-out
              hover:bg-gray-200 hover:shadow-sm hover:scale-110
              active:bg-gray-300 active:scale-95"
          >
            ←
          </button>
          
          <h2 className="text-xl font-medium text-gray-900">
            {format(selectedDate, 'MMMM, yyyy')}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-full cursor-pointer
              transition-all duration-200 ease-in-out
              hover:bg-gray-200 hover:shadow-sm hover:scale-110
              active:bg-gray-300 active:scale-95"
          >
            →
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No expenses recorded for this month
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(expense.date), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {expense.category} • {expense.payment_method}
                    </p>
                  </div>
                  <p className={`font-medium ${
                    expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {expense.type === 'income' ? '+' : '-'}${Math.abs(expense.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 