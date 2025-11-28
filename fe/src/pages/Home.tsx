import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Modal, Descriptions, Spin, Card, DatePicker, Select, Space } from "antd";
import { useState, useMemo, useEffect, useCallback } from "react";
import { getTodaySchedule, getBookingById } from "../services/booking";
import { getAllStaff } from "../services/staff";
import dayjs, { Dayjs } from "dayjs";
import { BOOKING_STATUS, USER_ROLE } from "../contants";
import { getServiceType, convertNameRole } from "../utils/helper";
import IBooking from "../types/booking";
import IStaffAssignment from "../types/staff-assignment";
import { IStaff } from "../types/staff";

const { Option } = Select;

interface ScheduleItem {
  id: string;
  type: "booking" | "assignment";
  staffId: string;
  staffName: string;
  staffRole: USER_ROLE;
  startTime: Date;
  endTime: Date;
  data: IBooking | IStaffAssignment;
}

function Home() {
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);

  useEffect(() => {
  const token = localStorage.getItem("tokenDentis");
  if (!token) {
    window.location.href = "/login";
  }
  }, []);

  // Get all staff for filter
  const { data: allStaff = [] } = useQuery({
    queryKey: ["allStaff"],
    queryFn: () => getAllStaff(undefined),
  });

  // Filter staff by role
  const doctors = useMemo(() => {
    return allStaff.filter((staff: IStaff) => staff.role === USER_ROLE.DOCTOR);
  }, [allStaff]);

  const ktvs = useMemo(() => {
    return allStaff.filter((staff: IStaff) => staff.role === USER_ROLE.STAFF);
  }, [allStaff]);

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["schedule", selectedDate.format("YYYY-MM-DD"), selectedStaffId, selectedRole],
    queryFn: () => getTodaySchedule(
      selectedDate.format("YYYY-MM-DD"),
      selectedStaffId,
      selectedRole
    ),
    refetchInterval: 60000, // Refetch every minute
  });

  // Generate time slots from 8:00 to 22:00 with 30-minute intervals
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < 22) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return slots;
  }, []);

  // Process data to create schedule items
  const scheduleItems = useMemo(() => {
    const items: ScheduleItem[] = [];

    // Process bookings (doctors) - filter out cancelled
    if (scheduleData?.bookings) {
      scheduleData.bookings.forEach((booking: IBooking) => {
        if (booking.doctorId && booking.status !== BOOKING_STATUS.CANCELLED) {
          // For doctors: use doctorDate if exists, otherwise appointmentDate for display
          const startTime = booking.doctorDate || booking.appointmentDate;
          items.push({
            id: booking._id,
            type: "booking",
            staffId: booking.doctorId._id,
            staffName: booking.doctorId.name,
            staffRole: booking.doctorId.role as USER_ROLE,
            startTime: new Date(startTime),
            endTime: new Date(booking.timeEnd),
            data: booking,
          });
        }
      });
    }

    // Process staff assignments (KTV)
    if (scheduleData?.staffAssignments) {
      scheduleData.staffAssignments.forEach((assignment: IStaffAssignment) => {
        if (assignment.staffId) {
          // Check if related booking is cancelled
          const relatedBooking = assignment.bookingId as IBooking;
          if (relatedBooking && typeof relatedBooking === 'object' && relatedBooking.status === BOOKING_STATUS.CANCELLED) {
            return; // Skip cancelled bookings
          }
          items.push({
            id: assignment._id,
            type: "assignment",
            staffId: assignment.staffId._id,
            staffName: assignment.staffId.name,
            staffRole: assignment.staffId.role as USER_ROLE,
            startTime: new Date(assignment.timeStart),
            endTime: new Date(assignment.timeEnd),
            data: assignment,
          });
        }
      });
    }

    return items;
  }, [scheduleData]);

  // Get unique staff list
  const staffList = useMemo(() => {
    const staffMap = new Map<string, { id: string; name: string; role: USER_ROLE }>();
    
    scheduleItems.forEach((item) => {
      if (!staffMap.has(item.staffId)) {
        staffMap.set(item.staffId, {
          id: item.staffId,
          name: item.staffName,
          role: item.staffRole,
        });
      }
    });

    let filteredStaff = Array.from(staffMap.values());

    // Filter by selected role if exists
    if (selectedRole) {
      filteredStaff = filteredStaff.filter(staff => staff.role === selectedRole);
    }

    return filteredStaff.sort((a, b) => {
      // Sort doctors first, then staff
      if (a.role === USER_ROLE.DOCTOR && b.role !== USER_ROLE.DOCTOR) return -1;
      if (a.role !== USER_ROLE.DOCTOR && b.role === USER_ROLE.DOCTOR) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [scheduleItems, selectedRole]);

  // Calculate row span for each item
  const getItemRowSpan = useCallback((startTime: Date, endTime: Date): number => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const startSlot = start.hour() * 2 + (start.minute() >= 30 ? 1 : 0);
    const endSlot = end.hour() * 2 + (end.minute() > 30 ? 1 : 0);
    return Math.max(1, endSlot - startSlot);
  }, []);

  // Get starting row index for an item
  const getItemStartRow = useCallback((startTime: Date): number => {
    const start = dayjs(startTime);
    const baseHour = 8;
    const hour = start.hour();
    const minute = start.minute();
    const rowIndex = (hour - baseHour) * 2 + (minute >= 30 ? 1 : 0);
    return Math.max(0, rowIndex);
  }, []);

  // Get items that start at a specific staff and time slot
  const getItemsStartingAtSlot = useCallback((staffId: string, slotIndex: number): ScheduleItem[] => {
    return scheduleItems
      .filter((item) => item.staffId === staffId)
      .filter((item) => getItemStartRow(item.startTime) === slotIndex)
      .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
  }, [scheduleItems, getItemStartRow]);

  const hasContinuingItems = useCallback((staffId: string, slotIndex: number): boolean => {
    return scheduleItems.some((item) => {
      if (item.staffId !== staffId) return false;
      const startRow = getItemStartRow(item.startTime);
      const rowSpan = getItemRowSpan(item.startTime, item.endTime);
      return startRow < slotIndex && startRow + rowSpan > slotIndex;
    });
  }, [scheduleItems, getItemStartRow, getItemRowSpan]);

  const handleItemClick = useCallback(async (item: ScheduleItem) => {
    // If it's a booking, fetch full details
    if (item.type === "booking") {
      try {
        const fullBooking = await getBookingById(item.id);
        setSelectedItem({
          ...item,
          data: fullBooking,
        });
      } catch {
        setSelectedItem(item);
      }
    } else {
      // For staff assignment, ensure bookingId is populated
      setSelectedItem(item);
    }
    setModalOpen(true);
  }, [setModalOpen, setSelectedItem]);

  const getStatusTag = (status: BOOKING_STATUS) => {
    const statusMap: Record<BOOKING_STATUS, { color: string; text: string }> = {
      [BOOKING_STATUS.BOOKED]: { color: "blue", text: "Đã đặt" },
      [BOOKING_STATUS.ARRIVED]: { color: "cyan", text: "Đã đến" },
      [BOOKING_STATUS.IN_PROGRESS]: { color: "orange", text: "Đang làm" },
      [BOOKING_STATUS.COMPLETED]: { color: "green", text: "Hoàn thành" },
      [BOOKING_STATUS.CANCELLED]: { color: "red", text: "Hủy" },
      // [BOOKING_STATUS.CHANGED]: { color: "purple", text: "Thay đổi lịch" },
    };
    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag style={{ marginRight: 0 }} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleFilterChange = (role: string | undefined) => {
    setSelectedRole(role);
    setSelectedStaffId(undefined); // Reset staff selection when role changes
  };

  const handleStaffChange = (staffId: string | undefined) => {
    setSelectedStaffId(staffId);
    // Auto set role based on selected staff
    if (staffId) {
      const staff = allStaff.find((s: IStaff) => s._id === staffId);
      if (staff) {
        setSelectedRole(staff.role);
      }
    } else {
      setSelectedRole(undefined);
    }
  };

  const hasSchedules = scheduleItems.length > 0;

  // Create columns
  const columns = useMemo(() => {
    if (!hasSchedules) return [];

    return [
      {
        title: "Thời gian",
        dataIndex: "time",
        key: "time",
        width: 80,
        align: "center" as const,
        fixed: "left" as const,
        render: (time: string) => <div style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>{time}</div>,
      },
      ...staffList.map((staff) => ({
        title: (
          <div>
            <div>{staff.name}</div>
            <Tag color={staff.role === USER_ROLE.DOCTOR ? "blue" : "cyan"} style={{ marginTop: 4 }}>
              {convertNameRole(staff.role)}
            </Tag>
          </div>
        ),
        key: staff.id,
        align: "center" as const,
        render: (_: unknown, record: { slotIndex: number }) => {
          const items = getItemsStartingAtSlot(staff.id, record.slotIndex);

          if (items.length === 0) {
            if (hasContinuingItems(staff.id, record.slotIndex)) {
              return {
                children: null,
                props: { rowSpan: 0 },
              };
            }
            return {
              children: null,
              props: {},
            };
          }

          const cellRowSpan = Math.max(
            ...items.map((item) => getItemRowSpan(item.startTime, item.endTime)),
            1
          );

          return {
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 6}}>
                {items.map((item) => {
                  const itemRowSpan = getItemRowSpan(item.startTime, item.endTime);
                  const isBooking = item.type === "booking";
                  const bookingData = item.data as IBooking;
                  const assignmentData = item.data as IStaffAssignment;
                  const assignmentBooking =
                    typeof assignmentData.bookingId === "object" && assignmentData.bookingId !== null
                      ? (assignmentData.bookingId as IBooking)
                      : null;

                  const serviceName = isBooking
                    ? bookingData.serviceId?.name
                    : assignmentData.serviceIds?.map((s) => s.name).join(", ");

                  const customerName = isBooking
                    ? bookingData.customerId?.name
                    : assignmentBooking?.customerId?.name || assignmentData.staffId?.name;

                  const statusTag = isBooking
                    ? getStatusTag(bookingData.status)
                    : assignmentBooking && getStatusTag(assignmentBooking.status);

                  return (
                    <div
                      key={`${item.staffId}-${item.id}`}
                      style={{
                        backgroundColor: isBooking ? "#e6f7ff" : "#f0f9ff",
                        width: "90%",
                        maxWidth: "200px",
                        border: `2px solid ${isBooking ? "#1890ff" : "#13c2c2"}`,
                        borderRadius: 4,
                        padding: 8,
                        margin: "2px auto",
                        cursor: "pointer",
                        minHeight: Math.max(40, itemRowSpan * 30 - 4),
                        position: "relative",
                        zIndex: 1,
                      }}
                      onClick={() => handleItemClick(item)}
                    >
                      <div style={{ fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>
                        {serviceName || ""}
                      </div>
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {customerName || ""}
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <div style={{ fontSize: 10, color: "#999" }}>
                          {dayjs(item.startTime).format("HH:mm")} - {dayjs(item.endTime).format("HH:mm")}
                        </div>
                        {statusTag && <div>{statusTag}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ),
            props: {
              rowSpan: cellRowSpan,
            },
          };
        },
      })),
    ];
  }, [hasSchedules, staffList, getItemsStartingAtSlot, hasContinuingItems, getItemRowSpan, handleItemClick]);

  const dataSource = useMemo(() => {
    if (!hasSchedules) return [];
    return timeSlots.map((time, index) => ({
      key: index,
      time,
      slotIndex: index,
    }));
  }, [hasSchedules, timeSlots]);

  const tableWidth = useMemo(() => {
    if (!hasSchedules) return 80;
    return 80 + staffList.length * 150;
  }, [hasSchedules, staffList.length]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Card
        title={`Lịch làm việc - ${selectedDate.format("DD/MM/YYYY")}`}
      extra={
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || dayjs())}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
          />
          <Select
            placeholder="Lọc theo vai trò"
            style={{ width: 150 }}
            allowClear
            value={selectedRole}
            onChange={handleFilterChange}
          >
            <Option value={USER_ROLE.DOCTOR}>Bác sĩ</Option>
            <Option value={USER_ROLE.STAFF}>Kỹ thuật viên</Option>
          </Select>
          <Select
            placeholder="Lọc theo nhân viên"
            style={{ width: 200 }}
            allowClear
            value={selectedStaffId}
            onChange={handleStaffChange}
            showSearch
            filterOption={(input, option) => {
              const children = option?.children;
              const value = typeof children === 'string' ? children : Array.isArray(children) ? children.join('') : '';
              return value.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {selectedRole === USER_ROLE.DOCTOR || !selectedRole
              ? doctors.map((doctor: IStaff) => (
                  <Option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </Option>
                ))
              : null}
            {selectedRole === USER_ROLE.STAFF || !selectedRole
              ? ktvs.map((ktv: IStaff) => (
                  <Option key={ktv._id} value={ktv._id}>
                    {ktv.name}
                  </Option>
                ))
              : null}
          </Select>
        </Space>
      }
      style={{ minHeight: "90vh", margin: -10 }}
      styles={{
        body: {
          padding: 0,
          overflow: "hidden",
        }
      }}
    >
      {!hasSchedules ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          Không có lịch trong ngày
        </div>
      ) : (
        <div style={{ width: "100%", overflowX: "auto", padding: "16px" }}>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            scroll={{
              x: tableWidth,
              y: "calc(100vh - 250px)",
            }}
            bordered
            size="small"
            tableLayout="fixed"
            style={{marginRight: 15}}
          />
        </div>
      )}
    </Card>

      <Modal
        title="Chi tiết lịch hẹn"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        footer={null}
        width={800}
        centered={true}
        style={{ top: 20 }}
      >
        {selectedItem && (
          <Descriptions bordered column={1}>
            {selectedItem.type === "booking" ? (
              <>
                <Descriptions.Item label="Khách hàng">
                  <div>
                    <div><strong>{(selectedItem.data as IBooking).customerId?.name || "-"}</strong></div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      SĐT: {(selectedItem.data as IBooking).customerId?.phone || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Địa chỉ: {(selectedItem.data as IBooking).customerId?.address || "-"}
                    </div>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ">
                  <div>
                    <div><strong>{(selectedItem.data as IBooking).serviceId?.name || "-"}</strong></div>
                    {(selectedItem.data as IBooking).serviceId?.type && (
                      <Tag color={(selectedItem.data as IBooking).serviceId?.type === "trick" ? "purple" : "blue"} style={{ marginTop: 4 }}>
                        {getServiceType((selectedItem.data as IBooking).serviceId!.type)}
                      </Tag>
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Bác sĩ">
                  {(selectedItem.data as IBooking).doctorId?.name || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian bắt đầu">
                  {dayjs((selectedItem.data as IBooking).appointmentDate).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                {(selectedItem.data as IBooking).doctorDate && (
                  <Descriptions.Item label="Thời gian bác sĩ">
                    {dayjs((selectedItem.data as IBooking).doctorDate).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Thời gian kết thúc dự kiến">
                  {dayjs((selectedItem.data as IBooking).timeEnd).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag((selectedItem.data as IBooking).status)}
                </Descriptions.Item>
                <Descriptions.Item label="Ưu tiên">
                  {(selectedItem.data as IBooking).priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú">
                  {(selectedItem.data as IBooking).note || "Không có ghi chú"}
                </Descriptions.Item>
                {(selectedItem.data as IBooking).staffAssignments && 
                 (selectedItem.data as IBooking).staffAssignments!.length > 0 && (
                  <>
                    <Descriptions.Item label="Phân công nhân viên">
                      {((selectedItem.data as IBooking).staffAssignments || []).map((assignment, index: number) => {
                        const assignments = (selectedItem.data as IBooking).staffAssignments || [];
                        return (
                          <div key={index} style={{ marginBottom: index < assignments.length - 1 ? 16 : 0 }}>
                            <div style={{ marginBottom: 8 }}>
                              <div><strong>{assignment.staffId?.name || "-"}</strong></div>
                              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                SĐT: {assignment.staffId?.phone || "-"}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              Dịch vụ: {assignment.serviceIds?.map((s) => s.name).join(", ") || "-"}
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              Bắt đầu: {dayjs(assignment.timeStart).format("DD/MM/YYYY HH:mm")}
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              Kết thúc: {dayjs(assignment.timeEnd).format("DD/MM/YYYY HH:mm")}
                            </div>
                            {index < assignments.length - 1 && (
                              <div style={{ borderTop: "1px solid #e8e8e8", marginTop: 12, paddingTop: 12 }} />
                            )}
                          </div>
                        );
                      })}
                    </Descriptions.Item>
                  </>
                )}
              </>
            ) : (
              <>
                <Descriptions.Item label="Kỹ thuật viên">
                  <div>
                    <div><strong>{(selectedItem.data as IStaffAssignment).staffId?.name || "-"}</strong></div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      SĐT: {(selectedItem.data as IStaffAssignment).staffId?.phone || "-"}
                    </div>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ">
                  {(selectedItem.data as IStaffAssignment).serviceIds
                    ?.map((s) => s.name)
                    .join(", ") || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian bắt đầu">
                  {dayjs((selectedItem.data as IStaffAssignment).timeStart).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian kết thúc">
                  {dayjs((selectedItem.data as IStaffAssignment).timeEnd).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                {typeof (selectedItem.data as IStaffAssignment).bookingId === "object" &&
                (selectedItem.data as IStaffAssignment).bookingId !== null && (
                  <>
                    <Descriptions.Item label="Lịch hẹn liên quan">
                      <div>
                        <div><strong>Khách hàng: {((selectedItem.data as IStaffAssignment).bookingId as IBooking).customerId?.name || "-"}</strong></div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          SĐT: {((selectedItem.data as IStaffAssignment).bookingId as IBooking).customerId?.phone || "-"}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Địa chỉ: {((selectedItem.data as IStaffAssignment).bookingId as IBooking).customerId?.address || "-"}
                        </div>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Dịch vụ lịch hẹn">
                      {((selectedItem.data as IStaffAssignment).bookingId as IBooking).serviceId?.name || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bác sĩ lịch hẹn">
                      {((selectedItem.data as IStaffAssignment).bookingId as IBooking).doctorId?.name || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thời gian bắt đầu lịch hẹn">
                      {dayjs(((selectedItem.data as IStaffAssignment).bookingId as IBooking).appointmentDate).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                    {((selectedItem.data as IStaffAssignment).bookingId as IBooking).doctorDate && (
                      <Descriptions.Item label="Thời gian bác sĩ lịch hẹn">
                        {dayjs(((selectedItem.data as IStaffAssignment).bookingId as IBooking).doctorDate).format("DD/MM/YYYY HH:mm")}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Thời gian kết thúc lịch hẹn">
                      {dayjs(((selectedItem.data as IStaffAssignment).bookingId as IBooking).timeEnd).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái lịch hẹn">
                      {getStatusTag(((selectedItem.data as IStaffAssignment).bookingId as IBooking).status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ưu tiên lịch hẹn">
                      {((selectedItem.data as IStaffAssignment).bookingId as IBooking).priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ghi chú lịch hẹn">
                      {((selectedItem.data as IStaffAssignment).bookingId as IBooking).note || "Không có ghi chú"}
                    </Descriptions.Item>
                  </>
                )}
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </>
  );
}

export default Home;
