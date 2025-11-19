import { useEffect, useState, useCallback } from 'react';
import { Card, Col, Row, Statistic, DatePicker, Spin } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined, 
  DollarOutlined 
} from '@ant-design/icons';
import { 
  Pie, 
  Column, 
  Line, 
  Area,
  Bar
} from '@ant-design/plots';
import { getListBooking } from '../services/booking';
import { getListCustomer } from '../services/customer';
import IBooking from '../types/booking';
import { BOOKING_STATUS } from '../contants';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

const { RangePicker } = DatePicker;

interface DashboardStats {
  totalBookings: number;
  totalCustomers: number;
  completedBookings: number;
  totalRevenue: number;
}

interface BookingStatusData {
  status: string;
  count: number;
}

interface ServiceBookingData {
  serviceName: string;
  count: number;
}

interface StaffWorkloadData {
  staffName: string;
  count: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalCustomers: 0,
    completedBookings: 0,
    totalRevenue: 0,
  });
  
  const [bookingStatusData, setBookingStatusData] = useState<BookingStatusData[]>([]);
  const [serviceBookingData, setServiceBookingData] = useState<ServiceBookingData[]>([]);
  const [staffWorkloadData, setStaffWorkloadData] = useState<StaffWorkloadData[]>([]);
  const [dailyBookingData, setDailyBookingData] = useState<TimeSeriesData[]>([]);
  const [monthlyBookingData, setMonthlyBookingData] = useState<TimeSeriesData[]>([]);
  
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [bookingsResponse, customersResponse] = await Promise.all([
        getListBooking(
          1, 
          10000, 
          undefined, 
          undefined,
          undefined,
          undefined,
          dateRange[0].format('YYYY-MM-DD'),
          dateRange[1].format('YYYY-MM-DD')
        ),
        getListCustomer(1, 10000, undefined)
      ]);

      const bookings: IBooking[] = bookingsResponse.data || [];
      const customers = customersResponse.data || [];
      
      // Calculate basic stats
      const totalBookings = bookings.length;
      const totalCustomers = customers.length;
      const completedBookings = bookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length;
      
      setStats({
        totalBookings,
        totalCustomers,
        completedBookings,
        totalRevenue: completedBookings * 500000, // Estimate average revenue
      });

      // Process booking status distribution
      const statusCounts: Record<string, number> = {};
      bookings.forEach(booking => {
        const statusLabel = getStatusLabel(booking.status);
        statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
      });
      
      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));
      setBookingStatusData(statusData);

      // Process service booking distribution
      const serviceCounts: Record<string, number> = {};
      bookings.forEach(booking => {
        if (booking.serviceId && typeof booking.serviceId === 'object') {
          const serviceName = booking.serviceId.name || 'Unknown';
          serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
        }
      });
      
      const serviceData = Object.entries(serviceCounts)
        .map(([serviceName, count]) => ({ serviceName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setServiceBookingData(serviceData);

      // Process staff workload
      const staffCounts: Record<string, number> = {};
      bookings.forEach(booking => {
        if (booking.doctorId && typeof booking.doctorId === 'object') {
          const staffName = booking.doctorId.name || 'Unknown';
          staffCounts[staffName] = (staffCounts[staffName] || 0) + 1;
        }
      });
      
      const staffData = Object.entries(staffCounts)
        .map(([staffName, count]) => ({ staffName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setStaffWorkloadData(staffData);

      // Process daily bookings trend
      const dailyCounts: Record<string, number> = {};
      bookings.forEach(booking => {
        const date = dayjs(booking.appointmentDate).format('YYYY-MM-DD');
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });
      
      const dailyData = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setDailyBookingData(dailyData);

      // Process monthly bookings for area chart
      const monthlyCounts: Record<string, number> = {};
      bookings.forEach(booking => {
        const month = dayjs(booking.appointmentDate).format('YYYY-MM');
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      });
      
      const monthlyData = Object.entries(monthlyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setMonthlyBookingData(monthlyData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusLabel = (status: BOOKING_STATUS): string => {
    const labels: Record<BOOKING_STATUS, string> = {
      [BOOKING_STATUS.BOOKED]: 'Đã đặt',
      [BOOKING_STATUS.ARRIVED]: 'Đã đến',
      [BOOKING_STATUS.IN_PROGRESS]: 'Đang làm',
      [BOOKING_STATUS.COMPLETED]: 'Hoàn thành',
      [BOOKING_STATUS.CANCELLED]: 'Đã hủy',
    };
    return labels[status] || status;
  };

  // Chart configurations
  const pieConfig = {
    data: bookingStatusData,
    angleField: 'count',
    colorField: 'status',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      { type: 'element-selected' },
      { type: 'element-active' },
    ],
    legend: {
      position: 'bottom' as const,
    },
  };

  const serviceColumnConfig = {
    data: serviceBookingData,
    xField: 'serviceName',
    yField: 'count',
    label: {
      position: 'top' as const,
      style: {
        fill: '#000000',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: true,
      },
    },
    meta: {
      serviceName: {
        alias: 'Dịch vụ',
      },
      count: {
        alias: 'Số lượng đặt',
      },
    },
  };

  const staffBarConfig = {
    data: staffWorkloadData,
    xField: 'count',
    yField: 'staffName',
    seriesField: 'staffName',
    legend: false,
    label: {
      position: 'right' as const,
    },
    meta: {
      staffName: {
        alias: 'Nhân viên',
      },
      count: {
        alias: 'Số lượng công việc',
      },
    },
  };

  const lineConfig = {
    data: dailyBookingData,
    xField: 'date',
    yField: 'count',
    point: {
      size: 5,
      shape: 'circle',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    meta: {
      date: {
        alias: 'Ngày',
      },
      count: {
        alias: 'Số lượng đặt lịch',
      },
    },
  };

  const areaConfig = {
    data: monthlyBookingData,
    xField: 'date',
    yField: 'count',
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    meta: {
      date: {
        alias: 'Tháng',
      },
      count: {
        alias: 'Số lượng',
      },
    },
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          Dashboard Thống kê
        </h1>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
          format="DD/MM/YYYY"
          style={{ marginBottom: 16 }}
        />
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số lịch hẹn"
              value={stats.totalBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số khách hàng"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lịch đã hoàn thành"
              value={stats.completedBookings}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu ước tính"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="đ"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Phân bố trạng thái lịch hẹn" bordered={false}>
            {bookingStatusData.length > 0 ? (
              <Pie {...pieConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Xu hướng đặt lịch theo ngày" bordered={false}>
            {dailyBookingData.length > 0 ? (
              <Line {...lineConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Top 10 dịch vụ được đặt nhiều nhất" bordered={false}>
            {serviceBookingData.length > 0 ? (
              <Column {...serviceColumnConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Khối lượng công việc của nhân viên" bordered={false}>
            {staffWorkloadData.length > 0 ? (
              <Bar {...staffBarConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Charts Row 3 */}
      <Row gutter={16}>
        <Col xs={24}>
          <Card title="Xu hướng đặt lịch theo tháng" bordered={false}>
            {monthlyBookingData.length > 0 ? (
              <Area {...areaConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;