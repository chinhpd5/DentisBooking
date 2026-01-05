import { Button, Col, DatePicker, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag, Tabs } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, QuestionCircleOutlined, SearchOutlined, DownloadOutlined } from "@ant-design/icons";
// Dynamic import for xlsx - install with: npm install xlsx
let XLSX: typeof import("xlsx");
import { getListBooking, deleteBooking, updateBookingStatus } from "../../services/booking";
import { getAllStaff } from "../../services/staff";
import toast from "react-hot-toast";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import IBooking from "../../types/booking";
import dayjs, { Dayjs } from "dayjs";
import { BOOKING_STATUS, SERVICE_TYPE, USER_ROLE } from "../../contants";
import { IStaff } from "../../types/staff";
import { ColumnType } from "antd/es/table";

const { Option } = Select;

type FilterType = {
  search?: string | undefined;
  status?: BOOKING_STATUS | undefined;
  doctorId?: string | undefined;
  staffId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
};

function BookingList() {
  const [form] = Form.useForm();
  const [timeForm] = Form.useForm();
  const today = dayjs().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, 'day').format("YYYY-MM-DD");
  const [filter, setFilter] = useState<FilterType>({
    fromDate: today,
    toDate: tomorrow,
  });
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    oldStatus: BOOKING_STATUS;
    newStatus: BOOKING_STATUS;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list');

  // Set giá trị mặc định cho form khi component mount
  useEffect(() => {
    const todayRange: [Dayjs, Dayjs] = [dayjs(), dayjs().add(1, 'day')];
    form.setFieldsValue({
      dateRange: todayRange,
    });
  }, [form]);

  // Cập nhật thời gian hiện tại mỗi giây để đồng hồ chạy
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: IBooking[] }>({
    queryKey: ["bookings", filter],
    queryFn: () =>
      getListBooking(
        filter.search,
        filter.status,
        filter.doctorId,
        filter.staffId,
        filter.fromDate,
        filter.toDate
      ),
    placeholderData: (prev) => prev,
  });

  if (error) {
    toast.error((error as Error).message);
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   toast.error("Xóa thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, comingTime, doingTime, completeTime, cancellationReason }: { 
      id: string; 
      status: BOOKING_STATUS;
      comingTime?: Date;
      doingTime?: Date;
      completeTime?: Date;
      cancellationReason?: string;
    }) => updateBookingStatus(id, status, comingTime, doingTime, completeTime, cancellationReason),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Cập nhật trạng thái thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    },
  });

  const { data: doctorList, isLoading: isLoadingDoctors } = useQuery<IStaff[]>({
    queryKey: ["staff", "doctors"],
    queryFn: () => getAllStaff(USER_ROLE.DOCTOR),
  });

  const { data: staffList, isLoading: isLoadingStaffs } = useQuery<IStaff[]>({
    queryKey: ["staff", "ktv"],
    queryFn: () => getAllStaff(USER_ROLE.STAFF),
  });

  // Mặc định chọn bác sĩ đầu tiên
  useEffect(() => {
    if (doctorList && doctorList.length > 0 && !filter.doctorId) {
      const firstDoctor = doctorList[0];
      form.setFieldsValue({
        doctorId: firstDoctor._id,
      });
      setFilter((prev) => ({
        ...prev,
        doctorId: firstDoctor._id,
      }));
    }
  }, [doctorList, form, filter.doctorId]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleStatusChange = useCallback((id: string, newStatus: BOOKING_STATUS, oldStatus: BOOKING_STATUS) => {
    // Nếu trạng thái không thay đổi, không làm gì
    if (newStatus === oldStatus) {
      return;
    }
    
    // Nếu booking đã bị hủy, không cho phép đổi sang trạng thái khác
    if (oldStatus === BOOKING_STATUS.CANCELLED) {
      toast.error("Booking đã hủy không thể đổi sang trạng thái khác");
      return;
    }
    
    // Lưu thông tin thay đổi để hiển thị confirm
    setPendingStatusChange({ id, oldStatus, newStatus });
    
    // Reset form và set giá trị mặc định là thời gian hiện tại hoặc lý do hủy
    timeForm.resetFields();
    if (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) {
      timeForm.setFieldValue('comingTime', dayjs());
    } else if (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) {
      timeForm.setFieldValue('doingTime', dayjs());
    } else if (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED) {
      timeForm.setFieldValue('completeTime', dayjs());
    } else if (newStatus === BOOKING_STATUS.CANCELLED) {
      timeForm.setFieldValue('cancellationReason', '');
    }
  }, [timeForm]);

  const handleConfirmStatusChange = () => {
    if (!pendingStatusChange) return;
    
    const { id, oldStatus, newStatus } = pendingStatusChange;
    
    // Kiểm tra xem có cần nhập thời gian hoặc lý do hủy không
    const needsTime = (
      (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) ||
      (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) ||
      (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED)
    );
    
    const needsCancellationReason = newStatus === BOOKING_STATUS.CANCELLED;
    
    if (needsTime || needsCancellationReason) {
      // Validate form trước khi submit
      timeForm.validateFields().then((values) => {
        const comingTime = values.comingTime ? values.comingTime.toDate() : undefined;
        const doingTime = values.doingTime ? values.doingTime.toDate() : undefined;
        const completeTime = values.completeTime ? values.completeTime.toDate() : undefined;
        const cancellationReason = values.cancellationReason || undefined;

        updateStatusMutation.mutate(
          { 
            id, 
            status: newStatus,
            comingTime,
            doingTime,
            completeTime,
            cancellationReason,
          },
          {
            onSuccess: () => {
              setPendingStatusChange(null);
              timeForm.resetFields();
            },
            onError: () => {
              setPendingStatusChange(null);
              timeForm.resetFields();
            },
          }
        );
      }).catch(() => {
        // Validation failed
      });
    } else {
      // Không cần thời gian hoặc lý do hủy, gửi luôn
      updateStatusMutation.mutate(
        { 
          id, 
          status: newStatus,
        },
        {
          onSuccess: () => {
            setPendingStatusChange(null);
            timeForm.resetFields();
          },
          onError: () => {
            setPendingStatusChange(null);
            timeForm.resetFields();
          },
        }
      );
    }
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
    timeForm.resetFields();
    // Invalidate queries để reset lại giá trị Select về giá trị cũ
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };

  // Kiểm tra có cần hiển thị input thời gian hoặc lý do hủy không
  const needsTimeInput = (): boolean => {
    if (!pendingStatusChange) return false;
    const { oldStatus, newStatus } = pendingStatusChange;
    return (
      (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) ||
      (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) ||
      (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED)
    );
  };

  // Kiểm tra có cần hiển thị input lý do hủy không
  const needsCancellationReasonInput = (): boolean => {
    if (!pendingStatusChange) return false;
    const { newStatus } = pendingStatusChange;
    return newStatus === BOOKING_STATUS.CANCELLED;
  };

  // Lấy label cho input thời gian
  const getTimeInputLabel = (): string => {
    if (!pendingStatusChange) return "";
    const { oldStatus, newStatus } = pendingStatusChange;
    if (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) {
      return "Thời gian đến";
    }
    if (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) {
      return "Thời gian bắt đầu làm";
    }
    if (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED) {
      return "Thời gian hoàn thành";
    }
    return "";
  };

  // Lấy field name cho input thời gian
  const getTimeFieldName = (): string => {
    if (!pendingStatusChange) return "";
    const { oldStatus, newStatus } = pendingStatusChange;
    if (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) {
      return "comingTime";
    }
    if (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) {
      return "doingTime";
    }
    if (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED) {
      return "completeTime";
    }
    return "";
  };

  // Hàm tính thời gian chờ
  const calculateWaitingTime = useCallback((record: IBooking): string | null => {
    const status = record.status;
    
    // "Đã đặt", "Hủy", "Thay đổi lịch": null (Để trống)
    if (status === BOOKING_STATUS.BOOKED || 
        status === BOOKING_STATUS.CANCELLED
        // status === BOOKING_STATUS.CHANGED
      ) {
      return null;
    }
    
    // "Đã đến": thời gian hiện tại - comingTime (đếm tăng dần)
    if (status === BOOKING_STATUS.ARRIVED) {
      if (!record.comingTime) return null;
      const comingTime = dayjs(record.comingTime);
      const diffMs = currentTime.diff(comingTime);
      return formatDuration(diffMs);
    }
    
    // "Đang làm", "Hoàn thành": thời gian doingTime - comingTime
    if (status === BOOKING_STATUS.IN_PROGRESS || status === BOOKING_STATUS.COMPLETED) {
      if (!record.comingTime || !record.doingTime) return null;
      const comingTime = dayjs(record.comingTime);
      const doingTime = dayjs(record.doingTime);
      const diffMs = doingTime.diff(comingTime);
      return formatDuration(diffMs);
    }
    
    return null;
  }, [currentTime]);

  // Hàm format thời gian dạng HH:mm:ss
  const formatDuration = (ms: number): string => {
    if (ms < 0) return "00:00:00";
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };


  const handleFinish = (values: {
    search?: string;
    status?: BOOKING_STATUS;
    doctorId?: string;
    staffId?: string;
    dateRange?: [Dayjs, Dayjs];
  }) => {
    const fromDate = values.dateRange?.[0] ? values.dateRange[0].format("YYYY-MM-DD") : undefined;
    const toDate = values.dateRange?.[1] ? values.dateRange[1].format("YYYY-MM-DD") : undefined;
    
    setFilter({
      search: values.search || undefined,
      status: values.status || undefined,
      doctorId: values.doctorId || undefined,
      staffId: values.staffId || undefined,
      fromDate,
      toDate,
    });

    // Kiểm tra điều kiện để hiển thị chế độ xem theo khung giờ
    // Phải có doctorId và toDate = fromDate + 1 ngày
    if (values.doctorId && fromDate && toDate) {
      const fromDateDayjs = dayjs(fromDate);
      const toDateDayjs = dayjs(toDate);
      const expectedToDate = fromDateDayjs.add(1, 'day').format("YYYY-MM-DD");
      if (toDateDayjs.format("YYYY-MM-DD") !== expectedToDate) {
        // Nếu không đủ điều kiện, chuyển về chế độ danh sách
        if (viewMode === 'schedule') {
          setViewMode('list');
        }
      }
    } else {
      // Nếu không đủ điều kiện, chuyển về chế độ danh sách
      if (viewMode === 'schedule') {
        setViewMode('list');
      }
    }
  };

  const handleReset = () => {
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, 'day').format("YYYY-MM-DD");
    const todayRange: [Dayjs, Dayjs] = [dayjs(), dayjs().add(1, 'day')];
    form.setFieldsValue({
      dateRange: todayRange,
    });
    setFilter({
      search: undefined,
      status: undefined,
      doctorId: undefined,
      staffId: undefined,
      fromDate: today,
      toDate: tomorrow,
    });
  };

  const getStatusText = useCallback((status: BOOKING_STATUS): string => {
    const statusMap: Record<BOOKING_STATUS, string> = {
      [BOOKING_STATUS.BOOKED]: "Đã đặt",
      [BOOKING_STATUS.ARRIVED]: "Đã đến",
      [BOOKING_STATUS.IN_PROGRESS]: "Đang làm",
      [BOOKING_STATUS.COMPLETED]: "Hoàn thành",
      [BOOKING_STATUS.CANCELLED]: "Hủy",
      // [BOOKING_STATUS.CHANGED]: "Thay đổi lịch",
    };
    return statusMap[status] || status;
  }, []);

  // Tạo danh sách các khung giờ 30 phút từ 8h đến 22h
  const timeSlots = useMemo(() => {
    const slots: Array<{ start: Dayjs; end: Dayjs; label: string }> = [];
    const startHour = 8;
    const endHour = 22;
    
    if (!filter.fromDate || !filter.doctorId) return slots;
    
    const selectedDate = dayjs(filter.fromDate);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const start = selectedDate.hour(hour).minute(minute).second(0).millisecond(0);
        const end = start.add(30, 'minute');
        slots.push({
          start,
          end,
          label: `${start.format("HH:mm")} - ${end.format("HH:mm")}`,
        });
      }
    }
    
    return slots;
  }, [filter.fromDate, filter.doctorId]);

  // Nhóm lịch hẹn theo khung giờ
  const bookingsByTimeSlot = useMemo(() => {
    if (!data?.data || !filter.doctorId || !filter.fromDate) return new Map();
    
    const map = new Map<string, IBooking[]>();
    
    data.data.forEach((booking) => {
      // Chỉ lấy booking của bác sĩ được chọn và không bị hủy
      const bookingDoctorId = typeof booking.doctorId === 'string' 
        ? booking.doctorId 
        : booking.doctorId?._id;
      
      if (bookingDoctorId !== filter.doctorId || booking.status === BOOKING_STATUS.CANCELLED) {
        return;
      }
      
      if (!booking.appointmentDate) return;
      
      const appointmentTime = dayjs(booking.appointmentDate);
      
      // Tìm khung giờ chứa appointmentDate
      for (const slot of timeSlots) {
        if (appointmentTime.isSameOrAfter(slot.start, 'minute') && appointmentTime.isBefore(slot.end, 'minute')) {
          const slotKey = slot.label;
          if (!map.has(slotKey)) {
            map.set(slotKey, []);
          }
          const bookingsInSlot = map.get(slotKey)!;
          if (bookingsInSlot.length < 3) {
            bookingsInSlot.push(booking);
          }
          break;
        }
      }
    });
    
    // Sắp xếp lịch hẹn trong mỗi khung giờ theo appointmentDate
    map.forEach((bookings) => {
      bookings.sort((a, b) => {
        const timeA = dayjs(a.appointmentDate);
        const timeB = dayjs(b.appointmentDate);
        return timeA.valueOf() - timeB.valueOf();
      });
    });
    
    return map;
  }, [data?.data, filter.doctorId, filter.fromDate, timeSlots]);

  // Kiểm tra điều kiện để hiển thị chế độ xem theo khung giờ
  // Điều kiện: có doctorId, có fromDate và toDate = fromDate + 1 ngày
  const canShowScheduleView = useMemo(() => {
    if (!filter.doctorId || !filter.fromDate || !filter.toDate) return false;
    const fromDateDayjs = dayjs(filter.fromDate);
    const toDateDayjs = dayjs(filter.toDate);
    const expectedToDate = fromDateDayjs.add(1, 'day').format("YYYY-MM-DD");
    return toDateDayjs.format("YYYY-MM-DD") === expectedToDate;
  }, [filter.doctorId, filter.fromDate, filter.toDate]);

  // Tạo dataSource cho chế độ xem theo khung giờ
  // Mỗi khung giờ sẽ có tối đa 3 dòng (lịch hẹn), nếu không đủ thì để trống
  const scheduleDataSource = useMemo(() => {
    const dataSource: Array<{ key: string; booking: IBooking | null; timeSlot: string; index: number }> = [];
    let globalIndex = 1;

    timeSlots.forEach((slot) => {
      const bookings = bookingsByTimeSlot.get(slot.label) || [];
      
      // Tạo tối đa 3 dòng cho mỗi khung giờ
      for (let i = 0; i < 3; i++) {
        dataSource.push({
          key: `${slot.label}-${i}`,
          booking: bookings[i] || null,
          timeSlot: slot.label,
          index: globalIndex++,
        });
      }
    });

    return dataSource;
  }, [timeSlots, bookingsByTimeSlot]);

  // Hàm xuất Excel cho chế độ xem theo khung giờ
  const handleExportExcel = useCallback(async () => {
    if (!filter.fromDate || !filter.doctorId || !scheduleDataSource || scheduleDataSource.length === 0) {
      toast.error("Vui lòng chọn bác sĩ và thời gian");
      return;
    }

    try {
      // Dynamic import xlsx
      const xlsxModule = await import("xlsx");
      XLSX = xlsxModule;

      const doctorName = doctorList?.find(d => d._id === filter.doctorId)?.name || "Chưa xác định";
      const dateStr = dayjs(filter.fromDate).format("DD/MM/YYYY");

      // Tạo workbook
      const wb = XLSX.utils.book_new();

      // Tạo dữ liệu cho Excel
      const excelData: (string | number)[][] = [];

      // Dòng đầu tiên: Thông tin thời gian và bác sĩ
      excelData.push([]);
      excelData.push(["Thời gian", dateStr]);
      excelData.push(["Lịch cho bác sĩ", doctorName]);
      excelData.push([]); // Dòng trống

      // Header của bảng
      excelData.push([
        "Khung giờ",
        "Số TT",
        "Tên khách hàng",
        "Dịch vụ",
        "Ngày hẹn",
        "Thời gian đến",
        "Thời gian chờ",
        "Trạng thái",
        "Ghi chú",
        "Lý do hủy"
      ]);

      // Dữ liệu từ scheduleDataSource (chỉ lấy các dòng có booking)
      scheduleDataSource.forEach((record) => {
        if (record.booking) {
          const booking = record.booking;
          const waitingTime = calculateWaitingTime(booking);
          
          excelData.push([
            record.timeSlot,
            record.index,
            booking.customerId?.name || "-",
            typeof booking.serviceId === 'object' ? booking.serviceId?.name || "-" : "-",
            booking.appointmentDate ? dayjs(booking.appointmentDate).format("DD/MM/YYYY HH:mm") : "-",
            booking.comingTime ? dayjs(booking.comingTime).format("DD/MM/YYYY HH:mm") : "-",
            waitingTime || "-",
            getStatusText(booking.status),
            booking.note || "-",
            booking.status === BOOKING_STATUS.CANCELLED && booking.cancellationReason 
              ? booking.cancellationReason 
              : "-"
          ]);
        }
      });

      // Tạo worksheet từ dữ liệu
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set độ rộng cột
      ws['!cols'] = [
        { wch: 15 }, // Khung giờ
        { wch: 8 },  // Số TT
        { wch: 20 }, // Tên khách hàng
        { wch: 25 }, // Dịch vụ
        { wch: 18 }, // Ngày hẹn
        { wch: 18 }, // Thời gian đến
        { wch: 15 }, // Thời gian chờ
        { wch: 12 }, // Trạng thái
        { wch: 30 }, // Ghi chú
        { wch: 30 }, // Lý do hủy
      ];

      // Merge cells cho dòng header thông tin
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 1, c: 1 }, e: { r: 1, c: 9 } }, // Merge dòng "Thời gian"
        { s: { r: 2, c: 1 }, e: { r: 2, c: 9 } }  // Merge dòng "Lịch cho bác sĩ"
      );

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, "Lịch bác sĩ");

      // Tạo tên file
      const fileName = `Lich_Bac_Si_${doctorName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '_')}.xlsx`;

      // Xuất file
      XLSX.writeFile(wb, fileName);
      toast.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      toast.error("Xuất Excel thất bại");
    }
  }, [filter.fromDate, filter.doctorId, scheduleDataSource, doctorList, calculateWaitingTime, getStatusText]);

  // Columns cho chế độ xem theo khung giờ (thêm cột Khung giờ ở đầu)
  const scheduleColumns = useMemo(() => [
    {
      title: "Khung giờ",
      dataIndex: "timeSlot",
      key: "timeSlot",
      width: 150,
      fixed: 'left' as const,
      render: (text: string, record: { booking: IBooking | null; index: number; timeSlot: string }) => {
        // Chỉ hiển thị khung giờ ở dòng đầu tiên của mỗi khung giờ (index: 1, 4, 7, 10, ...)
        // index bắt đầu từ 1, mỗi khung giờ có 3 dòng
        const isFirstInSlot = (record.index - 1) % 3 === 0;
        if (isFirstInSlot) {
          return <strong>{text}</strong>;
        }
        return "";
      },
      onCell: (record: { booking: IBooking | null; index: number; timeSlot: string }) => {
        const isFirstInSlot = (record.index - 1) % 3 === 0;
        if (isFirstInSlot) {
          // Đếm số booking thực tế trong khung giờ này để set rowSpan
          const bookings = bookingsByTimeSlot.get(record.timeSlot) || [];
          const bookingCount = bookings.length;
          // Nếu không có booking nào, rowSpan = 3, nếu có thì rowSpan = bookingCount
          return {
            rowSpan: bookingCount === 0 ? 3 : bookingCount,
          };
        }
        return {
          rowSpan: 0,
        };
      },
    },
    {
      title: "STT",
      render: (_: unknown, record: { booking: IBooking | null; index: number }) => record.index,
      width: 70,
      ...(isMobile ? {} : { fixed: 'left' as const }),
    },
    {
      title: "Khách hàng",
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return (
          <div>
            <div>{record.booking.customerId?.name || "-"}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{record.booking.customerId?.phone || "-"}</div>
          </div>
        );
      },
      ...(isMobile ? {} : { fixed: 'left' as const }),
    },
    {
      title: "Dịch vụ",
      onCell: () => ({
        style: { minWidth: 180 },
      }),
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return record.booking.serviceId?.name || "-";
      },
      ...(isMobile ? {} : { fixed: 'left' as const }),
    },
    {
      title: "Ngày hẹn",
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return record.booking.appointmentDate ? dayjs(record.booking.appointmentDate).format("DD/MM/YYYY HH:mm") : "-";
      },
    },
    {
      title: "Thời gian đến",
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return record.booking.comingTime ? dayjs(record.booking.comingTime).format("DD/MM/YYYY HH:mm") : "-";
      },
    },
    {
      title: "Thời gian chờ",
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        const waitingTime = calculateWaitingTime(record.booking);
        if (waitingTime === null) {
          return "-";
        }
        return (
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: 16, 
            fontWeight: 'bold',
            color: record.booking.status === BOOKING_STATUS.ARRIVED ? '#ff9800' : 
                   record.booking.status === BOOKING_STATUS.IN_PROGRESS ? '#1890ff' : '#52c41a'
          }}>
            {waitingTime}
          </div>
        );
      },
    },
    {
      title: "Bác sỹ/ KTV",
      onCell: () => ({
        style: { minWidth: 220 },
      }),
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        if (record.booking.type === SERVICE_TYPE.TRICK) {
          return record.booking.doctorId?.name || "-";
        }
        if (record.booking.type === SERVICE_TYPE.JOB) {
          const staffNames =
            record.booking.staffAssignments
              ?.map((assignment) => assignment.staffId?.name)
              .filter((name): name is string => Boolean(name)) || [];
          if (staffNames.length > 0) {
            return staffNames.join(", ");
          }
          return "-";
        }
        return record.booking.doctorId?.name || "-";
      },
    },
    {
      title: "Trạng thái",
      render: (_: unknown, record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        const bookingStatus = record.booking.status;
        const isPendingForThisRecord = pendingStatusChange?.id === record.booking._id;
        
        return (
          <Select
            value={bookingStatus}
            onChange={(value) => handleStatusChange(record.booking!._id, value, bookingStatus)}
            style={{ width: 'auto', minWidth: 'fit-content' }}
            loading={updateStatusMutation.isPending && isPendingForThisRecord}
            disabled={
              updateStatusMutation.isPending || 
              (pendingStatusChange !== null && !isPendingForThisRecord) ||
              bookingStatus === BOOKING_STATUS.CANCELLED
            }
          >
            <Option value={BOOKING_STATUS.BOOKED}>
              <Tag color="blue">Đã đặt</Tag>
            </Option>
            <Option value={BOOKING_STATUS.ARRIVED}>
              <Tag color="cyan">Đã đến</Tag>
            </Option>
            <Option value={BOOKING_STATUS.IN_PROGRESS}>
              <Tag color="orange">Đang làm</Tag>
            </Option>
            <Option value={BOOKING_STATUS.COMPLETED}>
              <Tag color="green">Hoàn thành</Tag>
            </Option>
            <Option value={BOOKING_STATUS.CANCELLED}>
              <Tag color="red">Hủy</Tag>
            </Option>
          </Select>
        );
      },
    },
    {
      title: "Ưu tiên",
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return record.booking.priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>;
      },
    },
    {
      title: "KS",
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return record.booking.KS ? "KS" : "";
      },
    },
    {
      title: "Lý do hủy",
      render: (record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return record.booking.status === BOOKING_STATUS.CANCELLED && record.booking.cancellationReason
          ? <div style={{ maxWidth: 200, wordBreak: 'break-word' }}>{record.booking.cancellationReason}</div>
          : "-";
      },
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: { booking: IBooking | null }) => {
        if (!record.booking) return "-";
        return (
          <Space size="middle">
            <Link to={`detail/${record.booking._id}`}>
              <Button
                color="blue"
                variant="solid"
                icon={<EyeOutlined />}
              ></Button>
            </Link>
            <Link to={`edit/${record.booking._id}`}>
              <Button
                color="orange"
                variant="solid"
                icon={<EditOutlined />}
              ></Button>
            </Link>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa không?"
              onConfirm={() => handleDelete(record.booking!._id)}
              okText="Xác nhận"
              cancelText="Không"
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            >
              <Button
                color="danger"
                variant="solid"
                icon={<DeleteOutlined />}
              ></Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ], [isMobile, pendingStatusChange, updateStatusMutation.isPending, calculateWaitingTime, handleDelete, handleStatusChange, bookingsByTimeSlot]);

  const columns = useMemo(() => [
    {
      title: "STT",
      render: (_: IBooking, __: IBooking, index: number) => index + 1,
      width: 70,
      ...(isMobile ? {} : { fixed: 'left' as const }),
    },
    {
      title: "Khách hàng",
      render: (record: IBooking) => (
        <div>
          <div>{record.customerId?.name || "-"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.customerId?.phone || "-"}</div>
        </div>
      ),
      ...(isMobile ? {} : { fixed: 'left' as const }),
    },
    {
      title: "Dịch vụ",
      onCell: () => ({
        style: { minWidth: 180 },
      }),
      render: (record: IBooking) => (
        record.serviceId?.name || "-"
      ),
      ...(isMobile ? {} : { fixed: 'left' as const }),
    },
    {
      title: "Ngày hẹn",
      render: (record: IBooking) =>
        record.appointmentDate ? dayjs(record.appointmentDate).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Thời gian đến",
      render: (record: IBooking) =>
        record.comingTime ? dayjs(record.comingTime).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Thời gian chờ",
      render: (record: IBooking) => {
        const waitingTime = calculateWaitingTime(record);
        if (waitingTime === null) {
          return "-";
        }
        return (
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: 16, 
            fontWeight: 'bold',
            color: record.status === BOOKING_STATUS.ARRIVED ? '#ff9800' : 
                   record.status === BOOKING_STATUS.IN_PROGRESS ? '#1890ff' : '#52c41a'
          }}>
            {waitingTime}
          </div>
        );
      },
    },
    {
      title: "Bác sỹ/ KTV",
      onCell: () => ({
        style: { minWidth: 220 },
      }),
      render: (record: IBooking) => {
        if (record.type === SERVICE_TYPE.TRICK) {
          return record.doctorId?.name || "-";
        }

        if (record.type === SERVICE_TYPE.JOB) {
          const staffNames =
            record.staffAssignments
              ?.map((assignment) => assignment.staffId?.name)
              .filter((name): name is string => Boolean(name)) || [];

          if (staffNames.length > 0) {
            return staffNames.join(", ");
          }

          return "-";
        }

        return record.doctorId?.name || "-";
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: BOOKING_STATUS, record: IBooking) => {
        const isPendingForThisRecord = pendingStatusChange?.id === record._id;
        
        return (
          <Select
            value={status}
            onChange={(value) => handleStatusChange(record._id, value, status)}
            style={{ width: 'auto', minWidth: 'fit-content' }}
            loading={updateStatusMutation.isPending && isPendingForThisRecord}
            disabled={
              updateStatusMutation.isPending || 
              (pendingStatusChange !== null && !isPendingForThisRecord) ||
              status === BOOKING_STATUS.CANCELLED // Disable nếu đã bị hủy
            }
          >
            <Option value={BOOKING_STATUS.BOOKED}>
              <Tag color="blue">Đã đặt</Tag>
            </Option>
            <Option value={BOOKING_STATUS.ARRIVED}>
              <Tag color="cyan">Đã đến</Tag>
            </Option>
            <Option value={BOOKING_STATUS.IN_PROGRESS}>
              <Tag color="orange">Đang làm</Tag>
            </Option>
            <Option value={BOOKING_STATUS.COMPLETED}>
              <Tag color="green">Hoàn thành</Tag>
            </Option>
            <Option value={BOOKING_STATUS.CANCELLED}>
              <Tag color="red">Hủy</Tag>
            </Option>
            {/* <Option value={BOOKING_STATUS.CHANGED}>
              <Tag color="purple">Thay đổi lịch</Tag>
            </Option> */}
          </Select>
        );
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      render: (priority: boolean) => (priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>),
    },
    {
      title: "KS",
      dataIndex: "KS",
      render: (KS: boolean) => (KS ? "KS" : ""),
    },
    {
      title: "Lý do hủy",
      render: (record: IBooking) =>
        record.status === BOOKING_STATUS.CANCELLED && record.cancellationReason
          ? <div style={{ maxWidth: 200, wordBreak: 'break-word' }}>{record.cancellationReason}</div>
          : "-",
    },
    {
      title: "",
      key: "actions",
      render: (_: IBooking, item: IBooking) => (
        <Space size="middle">
          <Link to={`detail/${item._id}`}>
            <Button
              color="blue"
              variant="solid"
              icon={<EyeOutlined />}
            ></Button>
          </Link>
          <Link to={`edit/${item._id}`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
            ></Button>
          </Link>
         
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa không?"
            onConfirm={() => handleDelete(item._id)}
            okText="Xác nhận"
            cancelText="Không"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
             <Button
                color="danger"
                variant="solid"
                icon={<DeleteOutlined />}
              ></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [isMobile, pendingStatusChange, updateStatusMutation.isPending, calculateWaitingTime, handleDelete, handleStatusChange]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3>Danh sách lịch hẹn</h3>
        <Link to="/booking/add">
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm mới
          </Button>
        </Link>
      </div>
      
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên khách hàng, số điện thoại" allowClear />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Option value={BOOKING_STATUS.BOOKED}>Đã đặt</Option>
                <Option value={BOOKING_STATUS.ARRIVED}>Đã đến</Option>
                <Option value={BOOKING_STATUS.IN_PROGRESS}>Đang làm</Option>
                <Option value={BOOKING_STATUS.COMPLETED}>Hoàn thành</Option>
                <Option value={BOOKING_STATUS.CANCELLED}>Hủy</Option>
                {/* <Option value={BOOKING_STATUS.CHANGED}>Thay đổi lịch</Option> */}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dateRange" label="Khoảng thời gian">
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="doctorId" label="Bác sĩ">
              <Select
                placeholder="Chọn bác sĩ"
                allowClear
                loading={isLoadingDoctors}
                showSearch
                optionFilterProp="children"
              >
                {doctorList?.map((doctor: { _id: string; name: string }) => (
                  <Option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="staffId" label="KTV">
              <Select
                placeholder="Chọn KTV"
                allowClear
                loading={isLoadingStaffs}
                showSearch
                optionFilterProp="children"
              >
                {staffList?.map((staff: { _id: string; name: string }) => (
                  <Option key={staff._id} value={staff._id}>
                    {staff.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col
            span={8}
            style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}
          >
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                  Lọc
                </Button>
                <Button onClick={handleReset}>Đặt lại</Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* Tabs để chuyển đổi giữa danh sách và xem theo khung giờ */}
      <Tabs
        activeKey={viewMode}
        onChange={(key) => setViewMode(key as 'list' | 'schedule')}
        items={[
          {
            key: 'list',
            label: 'Danh sách',
            children: (
      <Table
        columns={columns as ColumnType<IBooking>[]}
        scroll={{ x: isMobile ? 'max-content' : 1500 }}
        loading={isLoading}
        dataSource={data?.data.map((item) => ({ ...item, key: item._id }))}
        locale={{ emptyText: 'Không có lịch đặt trong thời gian này' }}
        pagination={false}
              />
            ),
          },
          ...(canShowScheduleView ? [{
            key: 'schedule',
            label: 'Xem theo khung giờ',
            children: (
              <div>
                {filter.fromDate && filter.doctorId && (
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Tag color="blue">Ngày: {dayjs(filter.fromDate).format("DD/MM/YYYY")}</Tag>
                      <Tag color="green">Bác sĩ: {doctorList?.find(d => d._id === filter.doctorId)?.name || "-"}</Tag>
                    </div>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={handleExportExcel}
                    >
                      Xuất Excel
                    </Button>
                  </div>
                )}
                <Table
                  columns={scheduleColumns as ColumnType<{ booking: IBooking | null; timeSlot: string; index: number }>[]}
                  scroll={{ x: isMobile ? 'max-content' : 1500 }}
                  loading={isLoading}
                  dataSource={scheduleDataSource}
                  locale={{ emptyText: 'Không có lịch đặt trong thời gian này' }}
                  pagination={false}
                />
              </div>
            ),
          }] : []),
        ]}
      />

      {/* Modal xác nhận đổi trạng thái */}
      <Modal
        title="Xác nhận đổi trạng thái"
        open={pendingStatusChange !== null}
        onOk={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={updateStatusMutation.isPending}
      >
        {pendingStatusChange && (
          <div>
            <p>Bạn có chắc chắn muốn đổi trạng thái từ</p>
            <p>
              <strong>{getStatusText(pendingStatusChange.oldStatus)}</strong> sang{" "}
              <strong>{getStatusText(pendingStatusChange.newStatus)}</strong>?
            </p>
            
            {(needsTimeInput() || needsCancellationReasonInput()) && (
              <Form form={timeForm} layout="vertical" style={{ marginTop: 16 }}>
                {needsTimeInput() && (
                  <Form.Item
                    name={getTimeFieldName()}
                    label={getTimeInputLabel()}
                    rules={[{ required: true, message: `Vui lòng nhập ${getTimeInputLabel().toLowerCase()}` }]}
                  >
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm:ss"
                      style={{ width: "100%" }}
                      placeholder={`Chọn ${getTimeInputLabel().toLowerCase()}`}
                    />
                  </Form.Item>
                )}
                {needsCancellationReasonInput() && (
                  <Form.Item
                    name="cancellationReason"
                    label="Lý do hủy"
                    rules={[{ required: true, message: "Vui lòng nhập lý do hủy" }]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Nhập lý do hủy"
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                )}
              </Form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BookingList;