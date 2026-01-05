import { Card, Col, Row, Statistic, DatePicker, Table, Space } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getListBooking } from "../services/booking";
import { getAllStaff } from "../services/staff";
import IBooking from "../types/booking";
import { BOOKING_STATUS, USER_ROLE } from "../contants";
import dayjs, { Dayjs } from "dayjs";
import { useState, useMemo } from "react";
import { ColumnType } from "antd/es/table";
import { IStaff } from "../types/staff";

const { RangePicker } = DatePicker;

function BookingStatistics() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs(),
    dayjs().add(1, 'day')
  ]);

  // Lấy danh sách booking
  const { data: bookingsData, isLoading } = useQuery<{ success: boolean; data: IBooking[] }>({
    queryKey: ["bookings-statistics", dateRange],
    queryFn: () =>
      getListBooking(
        undefined,
        undefined,
        undefined,
        undefined,
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD")
      ),
  });

  // Lấy danh sách bác sĩ
  const { data: doctorList } = useQuery<IStaff[]>({
    queryKey: ["staff", "doctors"],
    queryFn: () => getAllStaff(USER_ROLE.DOCTOR),
  });

  const bookings = bookingsData?.data || [];

  // Tổng số lượng booking
  const totalBookings = useMemo(() => {
    return bookings.length;
  }, [bookings]);

  // Đếm booking theo trạng thái
  const bookingsByStatus = useMemo(() => {
    const statusCount: Record<BOOKING_STATUS, number> = {
      [BOOKING_STATUS.BOOKED]: 0,
      [BOOKING_STATUS.ARRIVED]: 0,
      [BOOKING_STATUS.IN_PROGRESS]: 0,
      [BOOKING_STATUS.COMPLETED]: 0,
      [BOOKING_STATUS.CANCELLED]: 0,
    };

    bookings.forEach((booking) => {
      if (booking.status in statusCount) {
        statusCount[booking.status as BOOKING_STATUS]++;
      }
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status as BOOKING_STATUS,
      count,
    }));
  }, [bookings]);

  // Đếm booking theo trạng thái theo từng bác sĩ
  const bookingsByDoctorAndStatus = useMemo(() => {
    const doctorStatusMap = new Map<string, Record<BOOKING_STATUS, number>>();

    bookings.forEach((booking) => {
      const doctorId = typeof booking.doctorId === 'string' 
        ? booking.doctorId 
        : booking.doctorId?._id;
      
      if (!doctorId) return;

      if (!doctorStatusMap.has(doctorId)) {
        doctorStatusMap.set(doctorId, {
          [BOOKING_STATUS.BOOKED]: 0,
          [BOOKING_STATUS.ARRIVED]: 0,
          [BOOKING_STATUS.IN_PROGRESS]: 0,
          [BOOKING_STATUS.COMPLETED]: 0,
          [BOOKING_STATUS.CANCELLED]: 0,
        });
      }

      const statusCount = doctorStatusMap.get(doctorId)!;
      if (booking.status in statusCount) {
        statusCount[booking.status as BOOKING_STATUS]++;
      }
    });

    const result: Array<{
      doctorId: string;
      doctorName: string;
      booked: number;
      arrived: number;
      inProgress: number;
      completed: number;
      cancelled: number;
      total: number;
    }> = [];

    doctorStatusMap.forEach((statusCount, doctorId) => {
      const doctor = doctorList?.find(d => d._id === doctorId);
      const doctorName = doctor?.name || "Chưa xác định";
      
      result.push({
        doctorId,
        doctorName,
        booked: statusCount[BOOKING_STATUS.BOOKED],
        arrived: statusCount[BOOKING_STATUS.ARRIVED],
        inProgress: statusCount[BOOKING_STATUS.IN_PROGRESS],
        completed: statusCount[BOOKING_STATUS.COMPLETED],
        cancelled: statusCount[BOOKING_STATUS.CANCELLED],
        total: Object.values(statusCount).reduce((sum, count) => sum + count, 0),
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [bookings, doctorList]);

  // Danh sách booking bị hủy
  const cancelledBookings = useMemo(() => {
    return bookings
      .filter((booking) => booking.status === BOOKING_STATUS.CANCELLED)
      .map((booking) => ({
        ...booking,
        key: booking._id,
      }));
  }, [bookings]);

  const getStatusText = (status: BOOKING_STATUS): string => {
    const statusMap: Record<BOOKING_STATUS, string> = {
      [BOOKING_STATUS.BOOKED]: "Đã đặt",
      [BOOKING_STATUS.ARRIVED]: "Đã đến",
      [BOOKING_STATUS.IN_PROGRESS]: "Đang làm",
      [BOOKING_STATUS.COMPLETED]: "Hoàn thành",
      [BOOKING_STATUS.CANCELLED]: "Hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: BOOKING_STATUS): string => {
    const colorMap: Record<BOOKING_STATUS, string> = {
      [BOOKING_STATUS.BOOKED]: "blue",
      [BOOKING_STATUS.ARRIVED]: "cyan",
      [BOOKING_STATUS.IN_PROGRESS]: "orange",
      [BOOKING_STATUS.COMPLETED]: "green",
      [BOOKING_STATUS.CANCELLED]: "red",
    };
    return colorMap[status] || "default";
  };

  // Columns cho bảng booking bị hủy
  const cancelledColumns: ColumnType<IBooking>[] = [
    {
      title: "STT",
      render: (_: IBooking, __: IBooking, index: number) => index + 1,
      width: 70,
    },
    {
      title: "Khách hàng",
      render: (record: IBooking) => (
        <div>
          <div>{record.customerId?.name || "-"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.customerId?.phone || "-"}</div>
        </div>
      ),
    },
    {
      title: "Dịch vụ",
      render: (record: IBooking) =>
        typeof record.serviceId === 'object' ? record.serviceId?.name || "-" : "-",
    },
    {
      title: "Bác sĩ",
      render: (record: IBooking) =>
        typeof record.doctorId === 'object' ? record.doctorId?.name || "-" : "-",
    },
    {
      title: "Ngày hẹn",
      render: (record: IBooking) =>
        record.appointmentDate ? dayjs(record.appointmentDate).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Lý do hủy",
      render: (record: IBooking) => (
        <div style={{ maxWidth: 300, wordBreak: 'break-word' }}>
          {record.cancellationReason || "-"}
        </div>
      ),
    },
  ];

  // Columns cho bảng thống kê theo bác sĩ
  const doctorStatusColumns: ColumnType<typeof bookingsByDoctorAndStatus[0]>[] = [
    {
      title: "STT",
      render: (_: unknown, __: unknown, index: number) => index + 1,
      width: 70,
    },
    {
      title: "Bác sĩ",
      dataIndex: "doctorName",
      key: "doctorName",
    },
    {
      title: "Đã đặt",
      dataIndex: "booked",
      key: "booked",
      align: "center" as const,
    },
    {
      title: "Đã đến",
      dataIndex: "arrived",
      key: "arrived",
      align: "center" as const,
    },
    {
      title: "Đang làm",
      dataIndex: "inProgress",
      key: "inProgress",
      align: "center" as const,
    },
    {
      title: "Hoàn thành",
      dataIndex: "completed",
      key: "completed",
      align: "center" as const,
    },
    {
      title: "Hủy",
      dataIndex: "cancelled",
      key: "cancelled",
      align: "center" as const,
    },
    {
      title: "Tổng",
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      render: (total: number) => <strong>{total}</strong>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Thống kê lịch hẹn</h2>
        <Space style={{ marginTop: 16 }}>
          <span>Khoảng thời gian:</span>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange(dates as [Dayjs, Dayjs]);
              }
            }}
            format="DD/MM/YYYY"
          />
        </Space>
      </div>

      {/* Tổng số lượng booking */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Statistic
              title="Tổng số lượng booking"
              value={totalBookings}
              prefix={<span style={{ fontSize: 24 }}>📊</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Đếm booking theo trạng thái */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Thống kê theo trạng thái">
            <Row gutter={16}>
              {bookingsByStatus.map((item) => (
                <Col span={4} key={item.status}>
                  <Statistic
                    title={getStatusText(item.status)}
                    value={item.count}
                    valueStyle={{ color: getStatusColor(item.status) === 'red' ? '#cf1322' : 
                                            getStatusColor(item.status) === 'green' ? '#3f8600' :
                                            getStatusColor(item.status) === 'orange' ? '#d46b08' :
                                            getStatusColor(item.status) === 'cyan' ? '#08979c' : '#1890ff' }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Đếm booking theo trạng thái theo từng bác sĩ */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Thống kê theo bác sĩ và trạng thái">
            <Table
              columns={doctorStatusColumns}
              dataSource={bookingsByDoctorAndStatus}
              loading={isLoading}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Danh sách booking bị hủy */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title={`Danh sách booking bị hủy (${cancelledBookings.length})`}>
            <Table
              columns={cancelledColumns}
              dataSource={cancelledBookings}
              loading={isLoading}
              pagination={false}
              locale={{ emptyText: 'Không có booking nào bị hủy trong khoảng thời gian này' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default BookingStatistics;

