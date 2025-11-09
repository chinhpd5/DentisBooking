import { Modal, Tag, message, TimePicker, Form } from "antd";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllStaff } from "../services/staff";
import { getListBooking } from "../services/booking";
import { getServiceById } from "../services/service";
import { IStaff } from "../types/staff";
import IBooking from "../types/booking";
import type IJob from "../types/job";
import IService from "../types/service";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { USER_ROLE, BOOKING_STATUS } from "../contants";
import { getServiceType, convertNameRole } from "../utils/helper";

dayjs.extend(isSameOrAfter);

export interface ScheduleSelectionInfo {
  staffId: string;
  staffName: string;
  staffRole: string;
  startTime: Dayjs;
  endTime: Dayjs;
  serviceType: string;
}

interface ScheduleSelectorProps {
  open: boolean;
  onCancel: () => void;
  onSelect: (info: ScheduleSelectionInfo) => void;
  selectedDate: Dayjs;
  serviceId: string;
}

interface TimeSlot {
  start: Dayjs;
  end: Dayjs;
  label: string;
  index: number;
}

interface BookingDisplay {
  booking: IBooking;
  startSlotIndex: number;
  endSlotIndex: number;
  service: IService | null;
  totalDuration: number; // in seconds
  actualEndTime: Dayjs; // Thời gian kết thúc thực tế
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  open,
  onCancel,
  onSelect,
  selectedDate,
  serviceId,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    staffId: string;
    timeSlot: TimeSlot;
    estimatedTime: Dayjs;
  } | null>(null);
  const [timeEditModalOpen, setTimeEditModalOpen] = useState(false);
  const [timeEditForm] = Form.useForm();
  const [pendingTimeValues, setPendingTimeValues] = useState<{
    startTime: Dayjs | null;
    endTime: Dayjs | null;
  } | null>(null);

  // Khi modal mở, set lại giá trị form nếu có pending values
  useEffect(() => {
    if (timeEditModalOpen && pendingTimeValues) {
      timeEditForm.setFieldsValue({
        startTime: pendingTimeValues.startTime,
        endTime: pendingTimeValues.endTime,
      });
    }
  }, [timeEditModalOpen, pendingTimeValues, timeEditForm]);

  // Helper function để chuyển đổi số thứ sang tên thứ trong tiếng Việt
  const getDayName = (date: Dayjs): string => {
    const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    return dayNames[date.day()];
  };

  // Lấy danh sách tất cả staff (bác sĩ và kỹ thuật viên)
  const { data: allStaff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["allStaff"],
    queryFn: () => getAllStaff(undefined),
    enabled: open,
  });

  // Helper function to get day schedule based on day of week
  const getDaySchedule = (staff: IStaff, dayOfWeek: number) => {
    switch (dayOfWeek) {
      case 1: return staff.scheduleMonday;
      case 2: return staff.scheduleTuesday;
      case 3: return staff.scheduleWednesday;
      case 4: return staff.scheduleThursday;
      case 5: return staff.scheduleFriday;
      case 6: return staff.scheduleSaturday;
      case 0: return staff.scheduleSunday;
      default: return null;
    }
  };

  // Lấy thông tin service
  const { data: service } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getServiceById(serviceId),
    enabled: !!serviceId && open,
  });

  // Kiểm tra staff có làm việc trong ngày không
  const hasWorkingSchedule = useCallback((staff: IStaff, dayOfWeek: number): boolean => {
    const daySchedule = getDaySchedule(staff, dayOfWeek);
    return !!(daySchedule && (daySchedule.morning || daySchedule.afternoon));
  }, []);

  // Kiểm tra staff có thể thực hiện service không
  const canStaffPerformService = useCallback((staff: IStaff): boolean => {
    if (!service) return false;
    
    // Nếu là job type, chỉ cần là STAFF (KTV)
    if (service.type === "job") {
      return staff.role === USER_ROLE.STAFF;
    }
    
    // Nếu là trick type, kiểm tra staff có trong danh sách staffIds không
    if (service.type === "trick") {
      if (!service.staffIds || service.staffIds.length === 0) {
        // Nếu không có staffIds, chỉ cần là DOCTOR
        return staff.role === USER_ROLE.DOCTOR;
      }
      // Kiểm tra staff có trong danh sách
      return service.staffIds.some((s: IStaff) => {
        const staffId = typeof s === "string" ? s : s._id;
        return staffId === staff._id;
      });
    }
    
    return false;
  }, [service]);

  // Lọc ra bác sĩ và kỹ thuật viên có thể thực hiện service và có ca làm việc
  const staffList = useMemo(() => {
    const dayOfWeek = selectedDate.day();
    return allStaff.filter(
      (staff: IStaff) => {
        // Phải là DOCTOR hoặc STAFF
        if (staff.role !== USER_ROLE.DOCTOR && staff.role !== USER_ROLE.STAFF) {
          return false;
        }
        // Phải có thể thực hiện service
        if (!canStaffPerformService(staff)) {
          return false;
        }
        // Phải có ca làm việc trong ngày
        return hasWorkingSchedule(staff, dayOfWeek);
      }
    );
  }, [allStaff, selectedDate, canStaffPerformService, hasWorkingSchedule]);

  // Map staff ID to staff object for quick lookup
  const staffMap = useMemo(() => {
    const map = new Map<string, IStaff>();
    staffList.forEach((staff: IStaff) => map.set(staff._id, staff));
    return map;
  }, [staffList]);


  // Tạo danh sách time slots (mỗi 30 phút từ 8:00 đến 22:00)
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const startMinute = 0;
    const endHour = 22;
    const endMinute = 0;

    let current = dayjs(selectedDate)
      .hour(startHour)
      .minute(startMinute)
      .second(0)
      .millisecond(0);

    const endTime = dayjs(selectedDate)
      .hour(endHour)
      .minute(endMinute)
      .second(0)
      .millisecond(0);

    let index = 0;
    while (current.isBefore(endTime) || current.isSame(endTime, "minute")) {
      const next = current.add(30, "minute");
      slots.push({
        start: current,
        end: next,
        label: `${current.format("HH:mm")} - ${next.format("HH:mm")}`,
        index: index++,
      });
      current = next;
    }
    return slots;
  }, [selectedDate]);

  // Lấy bookings cho ngày được chọn
  const fromDate = selectedDate.startOf("day").toISOString();
  const toDate = selectedDate.endOf("day").toISOString();

  const { data: bookingsData } = useQuery({
    queryKey: ["bookings", fromDate, toDate],
    queryFn: () =>
      getListBooking(1, 1000, undefined, undefined, undefined, fromDate, toDate),
    enabled: open && !!selectedDate,
  });

  // Tính toán thời gian tổng cộng của service (service.time + sum of job.time)
  const calculateServiceDuration = (service: IService): number => {
    if (!service) return 0;
    let total = service.time || 0; // service.time là seconds
    if (service.jobIds && service.jobIds.length > 0) {
      total += service.jobIds.reduce((sum: number, job: IJob) => sum + (job.time || 0), 0);
    }
    return total;
  };

  // Lấy service info cho mỗi booking
  const { data: servicesMap = new Map() } = useQuery({
    queryKey: ["servicesForBookings"],
    queryFn: async () => {
      const bookings: IBooking[] = bookingsData?.data || [];
      const serviceIds = new Set<string>();
      bookings.forEach((booking) => {
        const serviceId = typeof booking.serviceId === "string" 
          ? booking.serviceId 
          : booking.serviceId?._id;
        if (serviceId) serviceIds.add(serviceId);
      });
      
      const map = new Map<string, IService>();
      await Promise.all(
        Array.from(serviceIds).map(async (id) => {
          try {
            const service = await getServiceById(id);
            map.set(id, service);
          } catch {
            // Ignore errors
          }
        })
      );
      return map;
    },
    enabled: !!bookingsData?.data && open,
  });

  // Tạo map bookings với thông tin hiển thị (spanning multiple slots)
  const bookingDisplays = useMemo(() => {
    const bookings: IBooking[] = bookingsData?.data || [];
    const displays: BookingDisplay[] = [];

    bookings.forEach((booking) => {
      // Loại bỏ booking có trạng thái "Hủy"
      if (booking.status === BOOKING_STATUS.CANCELLED) return;
      
      if (!booking.appointmentDate) return;
      
      const staffId = booking.doctorId 
        ? (typeof booking.doctorId === "string" ? booking.doctorId : booking.doctorId._id)
        : null;
      
      if (!staffId) return;

      const appointmentTime = dayjs(booking.appointmentDate);
      const serviceId = typeof booking.serviceId === "string" 
        ? booking.serviceId 
        : booking.serviceId?._id;
      const service = serviceId ? servicesMap.get(serviceId) : null;
      
      // Tính thời gian kết thúc
      const totalDuration = service ? calculateServiceDuration(service) : 0;
      const endTime = appointmentTime.add(totalDuration, "second");

      // Tìm slot index cho thời gian bắt đầu
      const startSlotIndex = timeSlots.findIndex(
        (slot) =>
          appointmentTime.isSameOrAfter(slot.start, "minute") &&
          appointmentTime.isBefore(slot.end, "minute")
      );

      // Tìm slot index cho thời gian kết thúc
      const endSlotIndex = timeSlots.findIndex(
        (slot) =>
          endTime.isSameOrAfter(slot.start, "minute") &&
          endTime.isBefore(slot.end, "minute")
      );

      if (startSlotIndex >= 0) {
        displays.push({
          booking,
          startSlotIndex,
          endSlotIndex: endSlotIndex >= 0 ? endSlotIndex : timeSlots.length - 1,
          service,
          totalDuration,
          actualEndTime: endTime, // Lưu thời gian kết thúc thực tế
        });
      }
    });

    return displays;
  }, [bookingsData?.data, timeSlots, servicesMap]);

  // Map bookings theo staffId để dễ truy vấn
  const bookingsByStaff = useMemo(() => {
    const map = new Map<string, BookingDisplay[]>();
    bookingDisplays.forEach((display) => {
      const staffId = display.booking.doctorId 
        ? (typeof display.booking.doctorId === "string" 
            ? display.booking.doctorId 
            : display.booking.doctorId._id)
        : null;
      if (staffId) {
        if (!map.has(staffId)) {
          map.set(staffId, []);
        }
        map.get(staffId)!.push(display);
      }
    });
    return map;
  }, [bookingDisplays]);

  // Kiểm tra xem slot có nằm trong giờ làm việc không
  const isSlotInWorkingHours = (staff: IStaff, slotIndex: number): boolean => {
    const slot = timeSlots[slotIndex];
    const dayOfWeek = selectedDate.day();
    const daySchedule = getDaySchedule(staff, dayOfWeek);

    if (!daySchedule) {
      return false; // Không có lịch làm việc
    }

    const slotStartMinutes = slot.start.hour() * 60 + slot.start.minute();
    const slotEndMinutes = slot.end.hour() * 60 + slot.end.minute();

    // Kiểm tra xem slot có nằm trong buổi sáng hoặc chiều không
    const isMorning = daySchedule.morning && 
      slotStartMinutes >= daySchedule.morning.start && 
      slotEndMinutes <= daySchedule.morning.end;
    const isAfternoon = daySchedule.afternoon && 
      slotStartMinutes >= daySchedule.afternoon.start && 
      slotEndMinutes <= daySchedule.afternoon.end;

    return isMorning || isAfternoon;
  };

  // Kiểm tra xem slot có bị chiếm bởi booking không (hoàn toàn hoặc một phần)
  const isSlotOccupied = (staffId: string, slotIndex: number): BookingDisplay | null => {
    const bookings = bookingsByStaff.get(staffId);
    if (!bookings) return null;

    const slot = timeSlots[slotIndex];
    if (!slot) return null;

    for (const display of bookings) {
      // Nếu slot nằm trong khoảng booking (từ startSlotIndex đến endSlotIndex)
      if (slotIndex >= display.startSlotIndex && slotIndex <= display.endSlotIndex) {
        // Kiểm tra xem slot có bị chiếm hoàn toàn hay chỉ một phần
        // Slot bị chiếm hoàn toàn nếu:
        // 1. Slot là slot đầu tiên và booking bắt đầu từ đầu slot
        // 2. Slot là slot ở giữa (không phải đầu và không phải cuối)
        // 3. Slot là slot cuối và booking kết thúc ở cuối slot (actualEndTime >= slot.end)
        
        // Slot chỉ bị chiếm một phần nếu:
        // - Slot là slot cuối và actualEndTime < slot.end (booking kết thúc ở giữa slot)
        
        if (slotIndex === display.endSlotIndex) {
          // Đây là slot cuối cùng, kiểm tra xem booking có kết thúc ở giữa slot không
          if (display.actualEndTime.isBefore(slot.end, "minute")) {
            // Booking kết thúc ở giữa slot, slot chỉ bị chiếm một phần
            // Trả về null để slot vẫn có thể chọn
            return null;
          }
        }
        
        // Slot bị chiếm hoàn toàn
        return display;
      }
    }
    return null;
  };

  // Lấy booking display cho một cell cụ thể
  const getBookingForCell = (staffId: string, slotIndex: number): BookingDisplay | null => {
    return isSlotOccupied(staffId, slotIndex);
  };

  const handleCellClick = (staffId: string, slot: TimeSlot) => {
    const staff = staffMap.get(staffId);
    if (!staff) return;

    // Kiểm tra giờ làm việc
    if (!isSlotInWorkingHours(staff, slot.index)) {
      message.warning("Khung giờ này ngoài giờ làm việc");
      return;
    }

    // Kiểm tra xem có bị chiếm hoàn toàn không
    const occupiedBooking = isSlotOccupied(staffId, slot.index);
    if (occupiedBooking) {
      // Kiểm tra xem slot có bị chiếm hoàn toàn hay chỉ một phần
      const slotEndTime = slot.end;
      if (occupiedBooking.actualEndTime.isBefore(slotEndTime, "minute")) {
        // Booking chỉ chiếm một phần slot, phần còn lại vẫn có thể chọn
        // Không hiển thị warning, cho phép chọn
      } else {
        // Slot bị chiếm hoàn toàn
        message.warning("Khung giờ này đã được đặt");
        return;
      }
    }

    // Tìm booking trước đó kết thúc trước slot được chọn
    const bookings = bookingsByStaff.get(staffId);
    let previousBookingEndTime: Dayjs | null = null;
    
    console.log("=== DEBUG: Tìm booking trước đó ===");
    console.log("StaffId:", staffId);
    console.log("Slot được chọn:", slot.start.format("DD/MM/YYYY HH:mm"), "-", slot.end.format("DD/MM/YYYY HH:mm"));
    console.log("Số lượng bookings cho staff:", bookings?.length || 0);
    
    if (bookings && bookings.length > 0) {
      // Tìm booking gần nhất kết thúc trong hoặc trước slot được chọn
      for (const display of bookings) {
        const bookingEndTime = display.actualEndTime;
        const bookingStartTime = dayjs(display.booking.appointmentDate);
        
        console.log("  - Booking:", bookingStartTime.format("DD/MM/YYYY HH:mm"), "->", bookingEndTime.format("DD/MM/YYYY HH:mm"));
        
        // Tìm booking kết thúc trước khi slot kết thúc (bookingEndTime <= slot.end)
        // Mục đích: tìm booking gần nhất kết thúc trong slot hoặc trước slot
        // Ví dụ: booking 10:00-12:10, slot 12:00-12:30 -> dùng 12:10 làm thời gian bắt đầu
        if (bookingEndTime.isBefore(slot.end) || bookingEndTime.isSame(slot.end, "minute")) {
          console.log("    -> Booking này kết thúc trong/trước slot");
          // Cập nhật nếu đây là booking gần nhất (kết thúc muộn nhất nhưng <= slot.end)
          if (!previousBookingEndTime || bookingEndTime.isAfter(previousBookingEndTime)) {
            previousBookingEndTime = bookingEndTime;
            console.log("    -> Cập nhật previousBookingEndTime:", previousBookingEndTime.format("DD/MM/YYYY HH:mm"));
          }
        }
      }
    }
    
    // Debug log
    if (previousBookingEndTime) {
      console.log("✓ Tìm thấy booking trước đó kết thúc lúc:", previousBookingEndTime.format("DD/MM/YYYY HH:mm"));
      console.log("✓ Thời gian bắt đầu sẽ là:", previousBookingEndTime.format("HH:mm"));
    } else {
      console.log("✗ Không tìm thấy booking trước đó, dùng thời gian slot:", slot.start.format("HH:mm"));
    }

    // Thời gian bắt đầu: nếu có booking trước đó thì dùng thời gian kết thúc của booking đó, nếu không thì dùng thời gian bắt đầu của slot
    const actualStartTime = previousBookingEndTime || slot.start;
    
    // Ước tính thời gian dựa trên service (từ thời gian bắt đầu thực tế)
    const estimatedEndTime = service 
      ? actualStartTime.add(calculateServiceDuration(service), "second")
      : actualStartTime.add(1, "hour");

    setSelectedCell({ 
      staffId, 
      timeSlot: slot,
      estimatedTime: estimatedEndTime
    });
    
    // Chỉ set giờ và phút cho TimePicker (không có ngày)
    const startTimeOnly = dayjs().hour(actualStartTime.hour()).minute(actualStartTime.minute()).second(0).millisecond(0);
    const endTimeOnly = dayjs().hour(estimatedEndTime.hour()).minute(estimatedEndTime.minute()).second(0).millisecond(0);
    
    // Lưu giá trị để set vào form khi modal mở
    setPendingTimeValues({
      startTime: startTimeOnly,
      endTime: endTimeOnly,
    });
    
    // Reset form trước khi set giá trị mới
    timeEditForm.resetFields();
    
    // Set giá trị mới ngay lập tức
    timeEditForm.setFieldsValue({
      startTime: startTimeOnly,
      endTime: endTimeOnly,
    });
    
    setTimeEditModalOpen(true);
  };

  const handleConfirmTime = async () => {
    if (!selectedCell) return;

    try {
      const values = await timeEditForm.validateFields();
      const startTimePicker = values.startTime as Dayjs;
      const endTimePicker = values.endTime as Dayjs;
      
      // Combine selectedDate với thời gian từ TimePicker
      const finalStartTime = selectedDate
        .hour(startTimePicker.hour())
        .minute(startTimePicker.minute())
        .second(0)
        .millisecond(0);
      
      const finalEndTime = selectedDate
        .hour(endTimePicker.hour())
        .minute(endTimePicker.minute())
        .second(0)
        .millisecond(0);
      
      const staff = staffMap.get(selectedCell.staffId);
      if (!staff) return;
      
      const selectionInfo: ScheduleSelectionInfo = {
        staffId: selectedCell.staffId,
        staffName: staff.name,
        staffRole: staff.role,
        startTime: finalStartTime,
        endTime: finalEndTime,
        serviceType: service?.type || "",
      };
      
      // Đóng modal chỉnh sửa thời gian trước
      setTimeEditModalOpen(false);
      setSelectedCell(null);
      timeEditForm.resetFields();
      
      // Đợi một chút để đảm bảo modal chỉnh sửa thời gian đóng trước
      setTimeout(() => {
        // Trả về thông tin và đóng modal chính
        onSelect(selectionInfo);
        onCancel();
      }, 100);
    } catch (error) {
      // Validation failed, không làm gì cả (Form sẽ hiển thị lỗi)
      console.error("Validation error:", error);
      // Return false để ngăn modal đóng khi validation fail
      return false;
    }
  };

  // Tính thời gian thực hiện
  const serviceTime = useMemo(() => {
    // Chuyển đổi seconds sang giờ:phút format
    const formatTime = (seconds: number) => {
      if (seconds === 0) return "00 giờ : 00 phút";
      if (seconds < 0) return "00 giờ : 00 phút";
      
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      if(hours === 0) return `${mins.toString().padStart(2, '0')} phút`;
      return `${hours.toString().padStart(2, '0')} giờ : ${mins.toString().padStart(2, '0')} phút`;
    };

    const serviceData = service;
    
    if (!serviceData) return { total: 0, detail: "", lines: [] };
    
    if (serviceData.type === "job") {
      return {
        total: serviceData.time,
        detail: formatTime(serviceData.time),
        lines: [`Công việc: ${formatTime(serviceData.time)}`],
      };
    } else {
      // type === "trick"
      const trickTime = serviceData.time || 0;
      const lines: string[] = [];
      
      lines.push(`Thủ thuật: ${formatTime(trickTime)}`);
      
      // Thêm các jobIds nếu có
      if (serviceData.jobIds && serviceData.jobIds.length > 0) {
        serviceData.jobIds.forEach((job: IJob) => {
          if (job.time) {
            lines.push(`  - ${job.name}: ${formatTime(job.time)}`);
          }
        });
      }
      
      const totalTime = trickTime + (serviceData.jobIds?.reduce((sum: number, job: IJob) => sum + (job.time || 0), 0) || 0);
      
      return {
        total: totalTime,
        detail: formatTime(totalTime),
        lines,
      };
    }
  }, [service]);

  // Render cell cho grid
  const renderCell = (staffId: string, slotIndex: number) => {
    const staff = staffMap.get(staffId);
    if (!staff) return null;

    const bookingDisplay = getBookingForCell(staffId, slotIndex);
    const isInWorkingHours = isSlotInWorkingHours(staff, slotIndex);
    const slot = timeSlots[slotIndex];

    // Nếu có booking và đây là slot đầu tiên của booking
    if (bookingDisplay && bookingDisplay.startSlotIndex === slotIndex) {
      const booking = bookingDisplay.booking;
      const serviceInfo = bookingDisplay.service;
      const customerName = typeof booking.customerId === "string"
              ? ""
              : booking.customerId?.name || "";
      
      const serviceName = serviceInfo?.name || "";
      const serviceType = serviceInfo?.type;
      const typeLabel = serviceType ? getServiceType(serviceType) : "";
      
      // Lấy tên các job nếu có
      const jobNames: string[] = [];
      if (serviceInfo?.jobIds && serviceInfo.jobIds.length > 0) {
        serviceInfo.jobIds.forEach((job: IJob) => {
          if (job.name) jobNames.push(job.name);
        });
      }

      const startTime = dayjs(booking.appointmentDate);
      const actualEndTime = bookingDisplay.actualEndTime;
      
      // Tính số slot bị chiếm hoàn toàn
      // Chỉ tính các slot bị chiếm hoàn toàn, không tính slot cuối nếu chỉ bị chiếm một phần
      let fullSlotsCount = 0;
      for (let i = bookingDisplay.startSlotIndex; i <= bookingDisplay.endSlotIndex; i++) {
        const checkSlot = timeSlots[i];
        if (!checkSlot) break;
        
        // Nếu là slot cuối cùng và booking kết thúc ở giữa slot, không tính slot này
        if (i === bookingDisplay.endSlotIndex && actualEndTime.isBefore(checkSlot.end, "minute")) {
          break;
        }
        fullSlotsCount++;
      }
      
      const span = fullSlotsCount;

      return (
        <div
          key={`${staffId}-${slotIndex}`}
          style={{
            gridRow: `span ${span}`,
            backgroundColor: "#f0f0f0",
            padding: "8px",
            borderRadius: 4,
            fontSize: 12,
            color: "#666",
            border: "1px solid #d9d9d9",
            cursor: "not-allowed",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            minHeight: `${span * 100}px`,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{serviceName}</div>
          {jobNames.length > 0 && (
            <div style={{ fontSize: 10, marginBottom: 4, color: "#888" }}>
              {jobNames.join(", ")}
            </div>
          )}
          {typeLabel && (
            <div style={{ marginBottom: 4 }}>
              <Tag color={serviceType === "job" ? "blue" : "purple"} style={{ fontSize: 10 }}>
                {typeLabel}
              </Tag>
            </div>
          )}
          <div style={{ fontSize: 10, marginBottom: 2 }}>
            {startTime.format("HH:mm")} - {actualEndTime.format("HH:mm")}
          </div>
          {customerName && (
            <div style={{ fontSize: 10, wordBreak: "break-word", color: "#999", marginTop: 2 }}>
              {customerName}
            </div>
          )}
        </div>
      );
    }

    // Nếu slot nằm trong một booking nhưng không phải slot đầu tiên
    // Logic này đã được xử lý ở phần render grid, nên ở đây không cần xử lý nữa
    // Nếu đến được đây nghĩa là slot không bị chiếm hoàn toàn hoặc không có booking

    // Cell trống hoặc có thể chọn
    const canSelect = isInWorkingHours && !bookingDisplay;

        return (
          <div
        key={`${staffId}-${slotIndex}`}
        onClick={() => canSelect && handleCellClick(staffId, slot)}
            style={{
          backgroundColor: canSelect ? "#ffffff" : "#f5f5f5",
              padding: "8px",
              borderRadius: 4,
          minHeight: "100px",
          cursor: canSelect ? "pointer" : "not-allowed",
          border: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: canSelect ? "#333" : "#999",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
          if (canSelect) {
                e.currentTarget.style.backgroundColor = "#e6f7ff";
                e.currentTarget.style.borderColor = "#1890ff";
              }
            }}
            onMouseLeave={(e) => {
          if (canSelect) {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#e0e0e0";
          }
        }}
      >
        {canSelect ? "Có thể chọn" : "Nghỉ làm"}
          </div>
        );
  };

  return (
    <Modal
      title={
        <div>
          <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
            Chọn lịch hẹn
            {service && (
            <h5 style={{ margin: "0 0 8px 0", color: "#0050b3" }}>
                {service.name}
              {service.type && (
                <Tag color={service.type === "job" ? "blue" : "purple"} style={{ marginLeft: 8 }}>
                  {getServiceType(service.type)}
                </Tag>
              )}
            </h5>
            )}
          </div>
          {service && (
            <div style={{ fontSize: 14, color: "#666" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 8 }}>
                {/* Cột 1: Thông tin Service */}
                <div style={{ 
                  backgroundColor: "#e6f7ff", 
                  padding: "12px", 
                  borderRadius: 6,
                  border: "1px solid #91d5ff"
                }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#1890ff" }}>Thông tin dịch vụ</h4>
        
                  <div style={{ marginBottom: 8 }}>
                    {serviceTime.lines.map((line, idx) => (
                      <div key={idx} style={{ marginBottom: 4, fontSize: 11 }}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <h4 style={{ margin: "8px 0 0 0", color: "#0050b3" }}>
                    Tổng thời gian: <span style={{ color: "#1890ff", fontWeight: "bold" }}>{serviceTime.detail}</span>
                  </h4>
                </div>

                {/* Cột 2: Thông tin Bác sĩ và KTV (nếu là trick) */}
                <div style={{ 
                  backgroundColor: service.type === "trick" ? "#f6ffed" : "#fafafa", 
                  padding: "12px", 
                  borderRadius: 6,
                  border: service.type === "trick" ? "1px solid #b7eb8f" : "1px solid #d9d9d9"
                }}>
                  {service.type === "trick" ? (
                    <>
                      <h4 style={{ margin: "0 0 8px 0", color: "#389e0d" }}>Thông tin thực hiện</h4>
                      {service.staffIds && service.staffIds.length > 0 && (
                        <div style={{ marginBottom: 12, display: "flex", gap: 4 }}>
                          <h5 style={{ margin: "0 0 8px 0", color: "#389e0d" }}>Bác sĩ có thể thực hiện:</h5>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {service.staffIds.map((staff: IStaff, idx: number) => (
                              <Tag key={staff._id || idx} color="cyan">
                                {staff.name}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                      {service.countStaff !== undefined && service.countStaff !== null && (
                        <div>
                          <h5 style={{ margin: "0 0 8px 0", color: "#389e0d" }}>
                            Số lượng KTV:{" "}
                            <Tag color="orange" style={{ fontSize: 11, padding: "0px 12px" }}>
                              {service.countStaff}
                            </Tag>
                          </h5>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: "#8c8c8c", fontStyle: "italic" }}>
                      <h4 style={{ margin: "0 0 8px 0", color: "#8c8c8c" }}>Thông tin thực hiện</h4>
                      <h6 style={{ margin: 0, color: "#bfbfbf" }}>Chỉ áp dụng cho thủ thuật</h6>
                    </div>
                  )}
                </div>

                {/* Cột 3: Ngày */}
                <div style={{ 
                  backgroundColor: "#fff7e6", 
                  padding: "12px", 
                  borderRadius: 6,
                  border: "1px solid #ffd591"
                }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#fa8c16" }}>Thông tin lịch hẹn</h4>
                  <h5 style={{ margin: "0 0 4px 0", color: "#d46b08" }}>
                    Thứ: <span style={{ color: "#fa8c16", fontWeight: "bold" }}>{getDayName(selectedDate)}</span>
                  </h5>
                  <h5 style={{ margin: 0, color: "#d46b08" }}>
                    Ngày chọn: <span style={{ color: "#fa8c16", fontWeight: "bold" }}>{selectedDate.format("DD/MM/YYYY")}</span>
                  </h5>
                </div>
              </div>
            </div>
          )}
        </div>
      }
      open={open}
      onCancel={() => {
        setSelectedCell(null);
        onCancel();
      }}
      width="95%"
      centered
      style={{ 
        maxWidth: 1600,
        top: 0,
        paddingBottom: 0,
      }}
      footer={null}
      maskClosable={false}
      wrapClassName="schedule-selector-modal"
      getContainer={() => document.body}
      styles={{
        body: {
        padding: "16px",
        maxHeight: "calc(100vh - 350px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }
      }}
    >
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 16,
        flex: 1,
        overflow: "hidden",
      }}>
        {/* Grid Schedule */}
        <div style={{ 
          display: "grid",
          gridTemplateColumns: `120px repeat(${staffList.length}, 1fr)`,
          gap: "1px",
          backgroundColor: "#e0e0e0",
          border: "1px solid #e0e0e0",
          overflow: "auto",
          maxHeight: "100%",
        }}>
          {/* Header - Time column */}
          <div style={{
            backgroundColor: "#fafafa",
            padding: "12px",
            fontWeight: "bold",
            textAlign: "center",
            position: "sticky",
            left: 0,
            zIndex: 20,
            borderRight: "2px solid #d9d9d9",
          }}>
            Thời gian
          </div>

          {/* Header - Staff columns */}
          {staffList.map((staff: IStaff, index: number) => (
            <div
              key={staff._id}
              style={{
                backgroundColor: "#fafafa",
                padding: "12px",
                fontWeight: "bold",
                textAlign: "center",
                borderBottom: "2px solid #d9d9d9",
                position: "sticky",
                top: 0,
                zIndex: 15,
                borderLeft: index === 0 ? "1px solid #e0e0e0" : "none",
              }}
            >
              <div>{staff.name}</div>
              <Tag 
                color={staff.role === USER_ROLE.DOCTOR ? "blue" : "cyan"} 
                style={{ marginTop: 4 }}
              >
                {convertNameRole(staff.role)}
              </Tag>
            </div>
          ))}

          {/* Time rows */}
          {timeSlots.map((slot: TimeSlot) => (
            <React.Fragment key={slot.index}>
              {/* Time label */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "8px",
                  textAlign: "center",
                  fontSize: 12,
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  borderRight: "2px solid #d9d9d9",
                  minHeight: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {slot.label}
              </div>

              {/* Cells for each staff */}
              {staffList.map((staff: IStaff) => {
                // Kiểm tra xem có booking nào chiếm slot này không
                const bookings = bookingsByStaff.get(staff._id);
                let shouldHide = false;
                
                if (bookings) {
                  for (const display of bookings) {
                    if (slot.index >= display.startSlotIndex && slot.index <= display.endSlotIndex) {
                      // Nếu là slot đầu tiên, render booking
                      if (display.startSlotIndex === slot.index) {
                        break;
                      }
                      // Nếu là slot cuối cùng, kiểm tra xem có bị chiếm hoàn toàn không
                      if (slot.index === display.endSlotIndex) {
                        const checkSlot = timeSlots[slot.index];
                        if (checkSlot && display.actualEndTime.isBefore(checkSlot.end, "minute")) {
                          // Slot chỉ bị chiếm một phần, không ẩn
                          break;
                        }
                      }
                      // Slot ở giữa hoặc slot cuối bị chiếm hoàn toàn, ẩn cell
                      shouldHide = true;
                      break;
                    }
                  }
                }
                
                if (shouldHide) {
                  return <div key={`${staff._id}-${slot.index}`} style={{ display: "none" }} />;
                }
                return renderCell(staff._id, slot.index);
              })}
            </React.Fragment>
          ))}
        </div>

        {loadingStaff && (
          <div style={{ textAlign: "center", padding: 20 }}>
            Đang tải...
          </div>
        )}
      </div>

      {/* Modal chỉnh sửa thời gian */}
      <Modal
        title="Chỉnh sửa thời gian"
        open={timeEditModalOpen}
        onCancel={() => {
          setTimeEditModalOpen(false);
          setSelectedCell(null);
          setPendingTimeValues(null);
          timeEditForm.resetFields();
        }}
        onOk={handleConfirmTime}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form form={timeEditForm} layout="vertical">
          <Form.Item
            name="startTime"
            label="Thời gian bắt đầu"
            rules={[{ required: true, message: "Vui lòng chọn thời gian bắt đầu" }]}
          >
            <TimePicker
              style={{ width: "100%" }}
              format="HH:mm"
              placeholder="Chọn thời gian bắt đầu"
              hourStep={1}
              // minuteStep={30}
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="Thời gian kết thúc (ước tính)"
            rules={[{ required: true, message: "Vui lòng chọn thời gian kết thúc" }]}
          >
            <TimePicker
              style={{ width: "100%" }}
              format="HH:mm"
              placeholder="Chọn thời gian kết thúc"
              hourStep={1}
              minuteStep={30}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default ScheduleSelector;

