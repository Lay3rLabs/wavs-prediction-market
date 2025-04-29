import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MarketProbability } from '@/types';
import { formatDate } from '@/utils/helpers';

interface MarketProbabilityChartProps {
  data: MarketProbability[];
}

const MarketProbabilityChart: React.FC<MarketProbabilityChartProps> = ({ data }) => {
  // Format data for chart display
  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.timestamp),
    yesPct: (item.yesProbability * 100).toFixed(2),
    noPct: (item.noProbability * 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={formattedData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF' }}
          tickMargin={10}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF' }}
          tickMargin={10}
          domain={[0, 100]}
          label={{ 
            value: 'Probability (%)', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#9CA3AF' }
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111827',
            borderColor: '#374151',
            borderRadius: '0.5rem',
            color: 'white',
          }}
          formatter={(value: any) => [`${value}%`]}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="yesPct"
          name="YES"
          stroke="#0EA5E9"
          fill="url(#colorYes)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="noPct"
          name="NO"
          stroke="#D946EF"
          fill="url(#colorNo)"
          stackId="1"
        />
        
        <defs>
          <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D946EF" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#D946EF" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MarketProbabilityChart;