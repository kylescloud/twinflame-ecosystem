import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatNumber } from '../lib/utils';

export function Analytics() {
  const [stats, setStats] = useState({
    totalTVL: 15250000,
    pooledTVL: 10500000,
    p2pTVL: 4750000,
    volume24h: 3450000,
    totalFees: 125000,
    uniqueUsers: 8542,
  });

  const tvlData = [
    { date: '01/03', pooled: 8500000, p2p: 3200000 },
    { date: '02/03', pooled: 9200000, p2p: 3800000 },
    { date: '03/03', pooled: 9800000, p2p: 4200000 },
    { date: '04/03', pooled: 10200000, p2p: 4500000 },
    { date: '05/03', pooled: 10500000, p2p: 4750000 },
  ];

  const volumeData = [
    { date: '01/03', volume: 2800000 },
    { date: '02/03', volume: 3100000 },
    { date: '03/03', volume: 2900000 },
    { date: '04/03', volume: 3300000 },
    { date: '05/03', volume: 3450000 },
  ];

  const distributionData = [
    { name: 'Pooled Lending', value: 10500000, color: '#0ea5e9' },
    { name: 'P2P Lending', value: 4750000, color: '#10b981' },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data } = await supabase
      .from('protocol_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setStats({
        totalTVL: Number(data.total_tvl),
        pooledTVL: Number(data.pooled_tvl),
        p2pTVL: Number(data.p2p_tvl),
        volume24h: Number(data.swap_volume_24h),
        totalFees: Number(data.total_fees_earned),
        uniqueUsers: Number(data.unique_users),
      });
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Protocol metrics and performance data</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-400">Total TVL</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalTVL, 0)}
              </div>
              <div className="text-green-500 text-xs mt-1">+12.5% this week</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-400">24h Volume</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats.volume24h, 0)}
              </div>
              <div className="text-green-500 text-xs mt-1">+8.2% today</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-400">Total Fees</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalFees, 0)}
              </div>
              <div className="text-gray-400 text-xs mt-1">Protocol revenue</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-400">Unique Users</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.uniqueUsers, 0)}
              </div>
              <div className="text-green-500 text-xs mt-1">+15.3% growth</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>TVL Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tvlData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value / 1000000}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    formatter={(value: number | undefined) => value ? formatCurrency(value, 0) : ''}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="pooled" stroke="#0ea5e9" strokeWidth={2} name="Pooled" />
                  <Line type="monotone" dataKey="p2p" stroke="#10b981" strokeWidth={2} name="P2P" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value / 1000000}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    formatter={(value: number | undefined) => value ? formatCurrency(value, 0) : ''}
                  />
                  <Bar dataKey="volume" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>TVL Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${((entry.value / stats.totalTVL) * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    formatter={(value: number | undefined) => value ? formatCurrency(value, 0) : ''}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                {distributionData.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-white font-medium">{item.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(item.value, 0)}</div>
                    <div className="text-sm text-gray-400">
                      {((item.value / stats.totalTVL) * 100).toFixed(1)}% of total TVL
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
