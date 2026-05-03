"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#94a3b8']; // Emerald for verified, Slate for pending

export default function DashboardCharts({ chartData }: { chartData: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mt-4 md:mt-6">
      
      {/* Volume Chart */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-[10px] md:text-xs font-black text-slate-500 mb-4 md:mb-6 uppercase tracking-widest shrink-0">Platform Deal Volume</h3>
        <div className="flex-1 min-h-[220px] md:min-h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }} 
              />
              <Bar dataKey="volume" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KYC Status Chart */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-[10px] md:text-xs font-black text-slate-500 mb-2 md:mb-4 uppercase tracking-widest shrink-0">Client KYC Distribution</h3>
        <div className="flex-1 min-h-[220px] md:min-h-[250px] w-full relative">
          
          {/* Custom Center Text for the Donut Chart */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
             <span className="text-2xl md:text-3xl font-black text-slate-900">{chartData.kycData[0].value + chartData.kycData[1].value}</span>
             <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clients</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.kycData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {chartData.kycData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }} 
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}