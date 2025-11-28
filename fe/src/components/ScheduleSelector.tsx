import { Modal, Tag, message, TimePicker, Form, Table } from "antd";
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

type BookingStaffAssignment = (NonNullable<IBooking["staffAssignments"]>[number]) & {
  bookingId?: IBooking | string;
  _id?: string;
};

interface BookingDisplay {
  booking: IBooking;
  staffId: string;
  staffRole: USER_ROLE;
  startSlotIndex: number;
  endSlotIndex: number;
  service: IService | null;
  totalDuration: number; // in seconds
  actualEndTime: Dayjs; // Thời gian kết thúc thực tế
  startTime: Dayjs;
  type: "doctor" | "assignment";
  assignment?: BookingStaffAssignment;
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
  const [pendingStartTime, setPendingStartTime] = useState<Dayjs | null>(null);
  const minStartTime = useMemo(() => pendingStartTime, [pendingStartTime]);

  // Kiểm tra xem ngày được chọn có phải là hôm nay không
  const isToday = useMemo(() => {
    return selectedDate.isSame(dayjs(), "day");
  }, [selectedDate]);

  // Kiểm tra xem slot có trong quá khứ không (chỉ áp dụng cho ngày hôm nay)
  const isSlotInPast = useCallback((slot: TimeSlot): boolean => {
    if (!isToday) return false;
    const now = dayjs();
    return slot.start.isBefore(now, "minute");
  }, [isToday]);

  const disabledStartHours = useCallback(() => {
    const disabled: number[] = [];
    
    // Nếu là hôm nay, disable các giờ đã qua
    if (isToday) {
      const currentHour = dayjs().hour();
      for (let i = 0; i < currentHour; i++) {
        disabled.push(i);
      }
    }
    
    // Nếu có minStartTime (từ booking trước đó), disable các giờ trước đó
    if (minStartTime) {
      const minHour = minStartTime.hour();
      for (let i = 0; i < minHour; i++) {
        if (!disabled.includes(i)) {
          disabled.push(i);
        }
      }
    }
    
    return disabled;
  }, [minStartTime, isToday]);

  const disabledStartMinutes = useCallback(
    (selectedHour: number) => {
      const disabled: number[] = [];
      
      // Nếu là hôm nay và đang chọn giờ hiện tại, disable các phút đã qua
      if (isToday) {
        const now = dayjs();
        const currentHour = now.hour();
        const currentMinute = now.minute();
        
        if (selectedHour === currentHour) {
          for (let i = 0; i <= currentMinute; i++) {
            disabled.push(i);
          }
        } else if (selectedHour < currentHour) {
          // Nếu chọn giờ trong quá khứ, disable tất cả phút
          for (let i = 0; i < 60; i++) {
            disabled.push(i);
          }
        }
      }
      
      // Nếu có minStartTime, disable các phút trước đó
      if (minStartTime) {
        const minHour = minStartTime.hour();
        if (selectedHour < minHour) {
          for (let i = 0; i < 60; i++) {
            if (!disabled.includes(i)) {
              disabled.push(i);
            }
          }
        } else if (selectedHour === minHour) {
          const minMinute = minStartTime.minute();
          for (let i = 0; i < minMinute; i++) {
            if (!disabled.includes(i)) {
              disabled.push(i);
            }
          }
        }
      }
      
      return disabled;
    },
    [minStartTime, isToday]
  );

  // Khi modal mở, set lại giá trị form nếu có pending values
  useEffect(() => {
    if (timeEditModalOpen && pendingStartTime) {
      timeEditForm.setFieldsValue({
        startTime: pendingStartTime,
      });
    }
  }, [timeEditModalOpen, pendingStartTime, timeEditForm]);

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
      getListBooking(1, 1000, undefined, undefined, undefined, undefined, fromDate, toDate),
    enabled: open && !!selectedDate,
  });

  // Tính toán thời gian tổng cộng của service (service.time + sum of job.time)
  const calculateServiceDuration = useCallback((serviceData?: IService | null): number => {
    if (!serviceData) return 0;
    let total = serviceData.time || 0;
    if (serviceData.jobIds && serviceData.jobIds.length > 0) {
      total += serviceData.jobIds.reduce((sum: number, job: IJob) => sum + (job.time || 0), 0);
    }
    return total;
  }, []);

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
      
      const doctorId =
        booking.doctorId
          ? ((booking.doctorId as IStaff)?._id || (typeof booking.doctorId === "string" ? booking.doctorId : undefined))
          : undefined;
      
      if (doctorId) {
        const appointmentTime = dayjs(booking.appointmentDate);
        const serviceId = typeof booking.serviceId === "string" 
          ? booking.serviceId 
          : booking.serviceId?._id;
        const service = serviceId ? servicesMap.get(serviceId) : null;
        
        // Tính thời gian kết thúc
        const totalDuration = calculateServiceDuration(service);
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
            staffId: doctorId,
            staffRole: (booking.doctorId as IStaff)?.role || USER_ROLE.DOCTOR,
            startSlotIndex,
            endSlotIndex: endSlotIndex >= 0 ? endSlotIndex : timeSlots.length - 1,
            service,
            totalDuration,
            actualEndTime: endTime, // Lưu thời gian kết thúc thực tế
            startTime: appointmentTime,
            type: "doctor",
          });
        }
      }

      if (booking.staffAssignments && booking.staffAssignments.length > 0) {
        booking.staffAssignments.forEach((assignment) => {
          const assignmentStaffId = assignment.staffId?._id;
          if (!assignmentStaffId) return;

          const assignmentStart = dayjs(assignment.timeStart);
          const assignmentEnd = dayjs(assignment.timeEnd);

          const assignmentStartSlot = timeSlots.findIndex(
            (slot) =>
              assignmentStart.isSameOrAfter(slot.start, "minute") &&
              assignmentStart.isBefore(slot.end, "minute")
          );

          const assignmentEndSlot = timeSlots.findIndex(
            (slot) =>
              assignmentEnd.isSameOrAfter(slot.start, "minute") &&
              assignmentEnd.isBefore(slot.end, "minute")
          );

          if (assignmentStartSlot >= 0) {
            displays.push({
              booking,
              staffId: assignmentStaffId,
              staffRole: assignment.staffId?.role || USER_ROLE.STAFF,
              startSlotIndex: assignmentStartSlot,
              endSlotIndex: assignmentEndSlot >= 0 ? assignmentEndSlot : timeSlots.length - 1,
              service: null,
              totalDuration: Math.max(0, assignmentEnd.diff(assignmentStart, "second")),
              actualEndTime: assignmentEnd,
              startTime: assignmentStart,
              type: "assignment",
              assignment,
            });
          }
        });
      }
    });

    return displays;
  }, [bookingsData?.data, timeSlots, servicesMap, calculateServiceDuration]);

  // Map bookings theo staffId để dễ truy vấn
  const bookingsByStaff = useMemo(() => {
    const map = new Map<string, BookingDisplay[]>();
    bookingDisplays.forEach((display) => {
      const staffId = display.staffId;
      if (!map.has(staffId)) {
        map.set(staffId, []);
      }
      map.get(staffId)!.push(display);
    });

    map.forEach((displays) => {
      displays.sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf());
    });

    return map;
  }, [bookingDisplays]);

  const getDisplayRowSpan = useCallback((display: BookingDisplay): number => {
    let span = 0;
    for (let idx = display.startSlotIndex; idx <= display.endSlotIndex; idx++) {
      const slot = timeSlots[idx];
      if (!slot) break;
      if (idx === display.endSlotIndex && display.actualEndTime.isBefore(slot.end, "minute")) {
        break;
      }
      span++;
    }
    return Math.max(1, span);
  }, [timeSlots]);

  const getDisplayStartRow = useCallback((display: BookingDisplay): number => {
    return display.startSlotIndex;
  }, []);

  const getDisplaysStartingAtSlot = useCallback((staffId: string, slotIndex: number): BookingDisplay[] => {
    return bookingDisplays
      .filter(
        (display) =>
          display.staffId === staffId &&
          getDisplayStartRow(display) === slotIndex
      )
      .sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf());
  }, [bookingDisplays, getDisplayStartRow]);

  const hasContinuingDisplays = useCallback((staffId: string, slotIndex: number): boolean => {
    return bookingDisplays.some((display) => {
      if (display.staffId !== staffId) return false;
      const startRow = getDisplayStartRow(display);
      const rowSpan = getDisplayRowSpan(display);
      return startRow < slotIndex && startRow + rowSpan > slotIndex;
    });
  }, [bookingDisplays, getDisplayRowSpan, getDisplayStartRow]);

  // Kiểm tra xem slot có nằm trong giờ làm việc không
  const isSlotInWorkingHours = useCallback((staff: IStaff, slotIndex: number): boolean => {
    const slot = timeSlots[slotIndex];
    const dayOfWeek = selectedDate.day();
    const daySchedule = getDaySchedule(staff, dayOfWeek);

    if (!daySchedule) {
      return false;
    }

    const slotStartMinutes = slot.start.hour() * 60 + slot.start.minute();
    const slotEndMinutes = slot.end.hour() * 60 + slot.end.minute();

    const isMorning =
      !!daySchedule.morning &&
      slotStartMinutes >= daySchedule.morning.start &&
      slotEndMinutes <= daySchedule.morning.end;
    const isAfternoon =
      !!daySchedule.afternoon &&
      slotStartMinutes >= daySchedule.afternoon.start &&
      slotEndMinutes <= daySchedule.afternoon.end;

    return isMorning || isAfternoon;
  }, [selectedDate, timeSlots]);

  const isSlotOccupied = useCallback((staffId: string, slotIndex: number): BookingDisplay | null => {
    const bookings = bookingsByStaff.get(staffId);
    if (!bookings) return null;

    const slot = timeSlots[slotIndex];
    if (!slot) return null;

    for (const display of bookings) {
      if (slotIndex >= display.startSlotIndex && slotIndex <= display.endSlotIndex) {
        if (slotIndex === display.endSlotIndex && display.actualEndTime.isBefore(slot.end, "minute")) {
          return null;
        }
        return display;
      }
    }
    return null;
  }, [bookingsByStaff, timeSlots]);

  // Count TRICK bookings in a 30-minute slot for a specific staff
  const countTrickBookingsInSlot = useCallback((staffId: string, slotIndex: number): number => {
    const slot = timeSlots[slotIndex];
    if (!slot) return 0;

    let count = 0;
    bookingDisplays.forEach((display) => {
      // Only count TRICK type bookings for this specific staff
      if (
        display.staffId === staffId &&
        display.booking.type === "trick" &&
        display.booking.status !== BOOKING_STATUS.CANCELLED
      ) {
        const appointmentTime = dayjs(display.booking.appointmentDate);
        // Check if appointment time falls within this 30-minute slot
        if (
          appointmentTime.isSameOrAfter(slot.start, "minute") &&
          appointmentTime.isBefore(slot.end, "minute")
        ) {
          count++;
        }
      }
    });
    return count;
  }, [bookingDisplays, timeSlots]);

  const handleCellClick = useCallback((staffId: string, slot: TimeSlot) => {
    const staff = staffMap.get(staffId);
    if (!staff) return;

    // Kiểm tra xem slot có trong quá khứ không (nếu là hôm nay)
    if (isSlotInPast(slot)) {
      message.warning("Không thể chọn khung giờ trong quá khứ");
      return;
    }

    // Kiểm tra giờ làm việc
    if (!isSlotInWorkingHours(staff, slot.index)) {
      message.warning("Khung giờ này ngoài giờ làm việc");
      return;
    }

    // Với TRICK type: check số lượng booking trong slot (tối đa 3)
    if (service?.type === "trick") {
      const bookingCount = countTrickBookingsInSlot(staffId, slot.index);
      if (bookingCount >= 3) {
        message.warning("Khung giờ này đã đầy (tối đa 3 lịch hẹn trong 30 phút)");
        return;
      }
    } else {
      // Với JOB type: giữ nguyên logic cũ (check conflict)
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
    }

    // Tìm booking trước đó kết thúc trước slot được chọn
    const bookings = bookingsByStaff.get(staffId);
    let previousBookingEndTime: Dayjs | null = null;
    
    // console.log("=== DEBUG: Tìm booking trước đó ===");
    // console.log("StaffId:", staffId);
    // console.log("Slot được chọn:", slot.start.format("DD/MM/YYYY HH:mm"), "-", slot.end.format("DD/MM/YYYY HH:mm"));
    // console.log("Số lượng bookings cho staff:", bookings?.length || 0);
    
    if (bookings && bookings.length > 0) {
      // Tìm booking gần nhất kết thúc trong hoặc trước slot được chọn
      for (const display of bookings) {
        const bookingEndTime = display.actualEndTime;
        // const bookingStartTime = dayjs(display.booking.appointmentDate);
        // console.log("  - Booking:", bookingStartTime.format("DD/MM/YYYY HH:mm"), "->", bookingEndTime.format("DD/MM/YYYY HH:mm"));
        
        // Tìm booking kết thúc trước khi slot kết thúc (bookingEndTime <= slot.end)
        // Mục đích: tìm booking gần nhất kết thúc trong slot hoặc trước slot
        // Ví dụ: booking 10:00-12:10, slot 12:00-12:30 -> dùng 12:10 làm thời gian bắt đầu
        if (bookingEndTime.isBefore(slot.end) || bookingEndTime.isSame(slot.end, "minute")) {
          // console.log("    -> Booking này kết thúc trong/trước slot");
          // Cập nhật nếu đây là booking gần nhất (kết thúc muộn nhất nhưng <= slot.end)
          if (!previousBookingEndTime || bookingEndTime.isAfter(previousBookingEndTime)) {
            previousBookingEndTime = bookingEndTime;
            // console.log("    -> Cập nhật previousBookingEndTime:", previousBookingEndTime.format("DD/MM/YYYY HH:mm"));
          }
        }
      }
    }
    
    // Debug log
    // if (previousBookingEndTime) {
    //   console.log("✓ Tìm thấy booking trước đó kết thúc lúc:", previousBookingEndTime.format("DD/MM/YYYY HH:mm"));
    //   console.log("✓ Thời gian bắt đầu sẽ là:", previousBookingEndTime.format("HH:mm"));
    // } else {
    //   console.log("✗ Không tìm thấy booking trước đó, dùng thời gian slot:", slot.start.format("HH:mm"));
    // }

    // Thời gian bắt đầu: nếu có booking trước đó thì dùng thời gian kết thúc của booking đó, nếu không thì dùng thời gian bắt đầu của slot
    let actualStartTime = slot.start;

    if (previousBookingEndTime) {
      const isEndWithinSlot =
        previousBookingEndTime.isSame(slot.start, "minute") ||
        (previousBookingEndTime.isAfter(slot.start, "minute") && previousBookingEndTime.isBefore(slot.end, "minute"));

      if (isEndWithinSlot) {
        actualStartTime = previousBookingEndTime;
      }
    }
    
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
    // Lưu giá trị để set vào form khi modal mở
    setPendingStartTime(startTimeOnly);
    
    // Reset form trước khi set giá trị mới
    timeEditForm.resetFields();
    
    // Set giá trị mới ngay lập tức
    timeEditForm.setFieldsValue({
      startTime: startTimeOnly,
    });
    
    setTimeEditModalOpen(true);
  }, [
    bookingsByStaff,
    calculateServiceDuration,
    isSlotInWorkingHours,
    isSlotOccupied,
    isSlotInPast,
    staffMap,
    service,
    setPendingStartTime,
    setSelectedCell,
    setTimeEditModalOpen,
    timeEditForm,
    countTrickBookingsInSlot,
  ]);

  const handleConfirmTime = async () => {
    if (!selectedCell) return;

    try {
      const values = await timeEditForm.validateFields();
      const startTimePicker = values.startTime as Dayjs;
      
      // Combine selectedDate với thời gian từ TimePicker
      const finalStartTime = selectedDate
        .hour(startTimePicker.hour())
        .minute(startTimePicker.minute())
        .second(0)
        .millisecond(0);
      
      const durationSeconds = service ? calculateServiceDuration(service) : 3600;
      const finalEndTime = finalStartTime.add(durationSeconds, "second");
      
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

  const tableColumns = useMemo(() => {
    const baseColumns = [
      {
        title: "Thời gian",
        dataIndex: "time",
        key: "time",
        width: 100,
        align: "center" as const,
        fixed: "left" as const,
        render: (time: string) => (
          <div style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>{time}</div>
        ),
      },
    ];

    const staffColumns = staffList.map((staff: IStaff) => ({
      title: (
        <div>
          <div>{staff.name}</div>
          <Tag color={staff.role === USER_ROLE.DOCTOR ? "blue" : "cyan"} style={{ marginTop: 4 }}>
            {convertNameRole(staff.role)}
          </Tag>
        </div>
      ),
      key: staff._id,
      align: "center" as const,
      render: (_: unknown, record: { slotIndex: number; slot: TimeSlot }) => {
        const items = getDisplaysStartingAtSlot(staff._id, record.slotIndex);

        if (items.length === 0) {
          if (hasContinuingDisplays(staff._id, record.slotIndex)) {
            return {
              children: null,
              props: { rowSpan: 0 },
            };
          }

          const slot = record.slot;
          const inWorkingHours = isSlotInWorkingHours(staff, record.slotIndex);
          const isPast = isSlotInPast(slot);
          
          // Với TRICK type: check số lượng booking trong slot
          let canSelect = false;
          let bookingCount = 0;
          let displayText = "Nghỉ làm";
          
          if (service?.type === "trick") {
            bookingCount = countTrickBookingsInSlot(staff._id, record.slotIndex);
            canSelect = inWorkingHours && bookingCount < 3 && !isPast;
            if (isPast) {
              displayText = "Đã qua";
            } else if (inWorkingHours) {
              displayText = bookingCount >= 3 
                ? `Đã đầy (${bookingCount}/3)` 
                : bookingCount > 0 
                  ? `Có thể chọn (${bookingCount}/3)` 
                  : "Có thể chọn";
            }
          } else {
            // Với JOB type: giữ nguyên logic cũ
            const occupied = isSlotOccupied(staff._id, record.slotIndex);
            canSelect = inWorkingHours && !occupied && !isPast;
            if (isPast) {
              displayText = "Đã qua";
            } else {
              displayText = canSelect ? "Có thể chọn" : "Nghỉ làm";
            }
          }

          return {
            children: (
              <div
                onClick={() => canSelect && handleCellClick(staff._id, slot)}
                style={{
                  backgroundColor: canSelect ? "#ffffff" : "#f5f5f5",
                  padding: 8,
                  borderRadius: 4,
                  minHeight: 100,
                  cursor: canSelect ? "pointer" : "not-allowed",
                  border: canSelect && service?.type === "trick" && bookingCount > 0 
                    ? "1px solid #ff9800" 
                    : "1px solid #e0e0e0",
                  display: "flex",
                  flexDirection: "column",
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
                    e.currentTarget.style.borderColor = 
                      service?.type === "trick" && bookingCount > 0 
                        ? "#ff9800" 
                        : "#e0e0e0";
                  }
                }}
              >
                <div>{displayText}</div>
                {service?.type === "trick" && bookingCount > 0 && (
                  <div style={{ fontSize: 10, color: "#ff9800", marginTop: 4 }}>
                    {bookingCount}/3 lịch
                  </div>
                )}
              </div>
            ),
            props: {},
          };
        }

        const cellRowSpan = Math.max(
          ...items.map((display) => getDisplayRowSpan(display)),
          1
        );

        // Check if there's remaining time in the slot after the last booking
        const slot = record.slot;
        const inWorkingHours = isSlotInWorkingHours(staff, record.slotIndex);
        const isPast = isSlotInPast(slot);
        const lastDisplay = items[items.length - 1];
        const hasRemainingTime = lastDisplay && lastDisplay.actualEndTime.isBefore(slot.end, "minute");
        
        // Với TRICK type: check số lượng booking trong slot và luôn hiển thị ô chọn nếu chưa đủ 3
        let canSelectRemaining = false;
        let remainingBookingCount = 0;
        let remainingDisplayText = "Có thể chọn";
        
        if (service?.type === "trick") {
          remainingBookingCount = countTrickBookingsInSlot(staff._id, record.slotIndex);
          // Luôn cho phép chọn nếu chưa đủ 3 lịch và không phải quá khứ
          canSelectRemaining = inWorkingHours && remainingBookingCount < 3 && !isPast;
          if (canSelectRemaining) {
            remainingDisplayText = remainingBookingCount > 0 
              ? `Chọn thêm (${remainingBookingCount}/3)` 
              : "Có thể chọn";
          } else if (isPast) {
            remainingDisplayText = "Đã qua";
          }
        } else {
          // Với JOB type: giữ nguyên logic cũ nhưng thêm kiểm tra isPast
          canSelectRemaining = hasRemainingTime && inWorkingHours && !isPast;
          if (isPast) {
            remainingDisplayText = "Đã qua";
          }
        }

        return {
          children: (
            <div style={{ display: "flex", flexDirection: "row", gap: 6, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {items.map((display) => {
                const isAssignment = display.type === "assignment";
                const booking = display.booking;
                const assignment = display.assignment;
                const serviceInfo = display.service;
                const assignmentBooking =
                  assignment &&
                  typeof assignment.bookingId === "object" &&
                  assignment.bookingId !== null
                    ? (assignment.bookingId as IBooking)
                    : null;
                const serviceName = isAssignment
                  ? assignment?.serviceIds?.map((svc) => svc.name).filter(Boolean).join(", ") ||
                    (typeof booking.serviceId === "object" ? booking.serviceId?.name : "") ||
                    ""
                  : serviceInfo?.name || "";
                const jobNames: string[] = [];
                if (!isAssignment && serviceInfo?.jobIds && serviceInfo.jobIds.length > 0) {
                  serviceInfo.jobIds.forEach((job: IJob) => {
                    if (job.name) jobNames.push(job.name);
                  });
                }
                const customerName = isAssignment
                  ? assignmentBooking?.customerId?.name || assignment?.staffId?.name || ""
                  : typeof booking.customerId === "string"
                  ? ""
                  : booking.customerId?.name || "";
                const itemRowSpan = getDisplayRowSpan(display);
                const serviceTypeLabel =
                  !isAssignment && serviceInfo?.type ? getServiceType(serviceInfo.type) : "";

                return (
                  <div
                    key={`${display.staffId}-${display.booking._id}-${display.type}-${assignment?._id || "doctor"}`}
                    style={{
                      backgroundColor: isAssignment ? "#f6ffed" : "#e6f7ff",
                      width: "90%",
                      maxWidth: 220,
                      border: `2px solid ${isAssignment ? "#52c41a" : "#1890ff"}`,
                      borderRadius: 4,
                      padding: 8,
                      margin: "2px auto",
                      cursor: "not-allowed",
                      minHeight: Math.max(40, itemRowSpan * 30 - 4),
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontWeight: "bold", fontSize: 12 }}>
                      {serviceName || "-"}
                    </div>
                    {jobNames.length > 0 && (
                      <div style={{ fontSize: 10, color: "#888" }}>
                        {jobNames.join(", ")}
                      </div>
                    )}
                    {serviceTypeLabel && (
                      <div>
                        <Tag color={serviceInfo?.type === "job" ? "blue" : "purple"} style={{ fontSize: 10 }}>
                          {serviceTypeLabel}
                        </Tag>
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#666" }}>
                      {display.startTime.format("HH:mm")} - {display.actualEndTime.format("HH:mm")}
                    </div>
                    {customerName && (
                      <div style={{ fontSize: 10, color: "#999" }}>{customerName}</div>
                    )}
                  </div>
                );
              })}
              </div>
              {canSelectRemaining && (
                <div
                  onClick={() => handleCellClick(staff._id, slot)}
                  style={{
                    backgroundColor: "#ffffff",
                    padding: 8,
                    borderRadius: 4,
                    minWidth: 100,
                    minHeight: 60,
                    cursor: "pointer",
                    border: service?.type === "trick" && remainingBookingCount > 0 
                      ? "2px solid #ff9800" 
                      : "2px dashed #1890ff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#333",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e6f7ff";
                    e.currentTarget.style.borderColor = "#1890ff";
                    e.currentTarget.style.borderStyle = "solid";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = 
                      service?.type === "trick" && remainingBookingCount > 0 
                        ? "#ff9800" 
                        : "#1890ff";
                    e.currentTarget.style.borderStyle = 
                      service?.type === "trick" && remainingBookingCount > 0 
                        ? "solid" 
                        : "dashed";
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{remainingDisplayText}</div>
                  {service?.type === "trick" && remainingBookingCount > 0 && (
                    <div style={{ fontSize: 10, color: "#ff9800", marginTop: 4 }}>
                      {remainingBookingCount}/3 lịch
                    </div>
                  )}
                </div>
              )}
            </div>
          ),
          props: {
            rowSpan: cellRowSpan,
          },
        };
      },
    }));

    return [...baseColumns, ...staffColumns];
  }, [
    staffList,
    getDisplaysStartingAtSlot,
    hasContinuingDisplays,
    getDisplayRowSpan,
    isSlotInWorkingHours,
    isSlotOccupied,
    isSlotInPast,
    handleCellClick,
    countTrickBookingsInSlot,
    service,
  ]);

  const tableDataSource = useMemo(
    () =>
      timeSlots.map((slot) => ({
        key: slot.index,
        time: slot.label,
        slotIndex: slot.index,
        slot,
      })),
    [timeSlots]
  );

  return (
    <Modal
      title={
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: 16,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
              <span>Chọn lịch hẹn -</span>
              {service && (
                <span style={{ color: "#0050b3", fontWeight: 600, display: "flex", alignItems: "center" }}>
                  {service.name}
                  {service.type && (
                    <Tag color={service.type === "job" ? "blue" : "purple"} style={{ marginLeft: 8 }}>
                      {getServiceType(service.type)}
                    </Tag>
                  )}
                </span>
              )}
          </div>
          {service && (
            <div style={{ fontSize: 14, color: "#666" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 8 }}>
                {/* Cột 1: Thông tin Service */}
                <div style={{ 
                  backgroundColor: "#e6f7ff", 
                  padding: "10px", 
                  borderRadius: 6,
                  border: "1px solid #91d5ff"
                }}>
                  <h4 style={{ color: "#1890ff" }}>Thông tin dịch vụ</h4>
        
                  <div>
                    {serviceTime.lines.map((line, idx) => (
                      <div key={idx} style={{ fontSize: 11 }}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <h4 style={{ color: "#0050b3" }}>
                    Tổng thời gian: <span style={{ color: "#1890ff", fontWeight: "bold" }}>{serviceTime.detail}</span>
                  </h4>
                </div>

                {/* Cột 2: Thông tin Bác sĩ và KTV (nếu là trick) */}
                <div style={{ 
                  backgroundColor: service.type === "trick" ? "#f6ffed" : "#fafafa", 
                  padding: "10px", 
                  borderRadius: 6,
                  border: service.type === "trick" ? "1px solid #b7eb8f" : "1px solid #d9d9d9"
                }}>
                  {service.type === "trick" ? (
                    <>
                      <h4 style={{ color: "#389e0d" }}>Thông tin thực hiện</h4>
                      {service.staffIds && service.staffIds.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: "100%" }}>
                          <h5 style={{ color: "#389e0d", margin: 0 }}>Bác sĩ có thể thực hiện:</h5>
                          <span
                            style={{
                              color: "#389e0d",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                            }}
                            title={service.staffIds.map((staff: IStaff) => staff.name).join(", ")}
                          >
                            {service.staffIds.map((staff: IStaff) => staff.name).join(", ")}
                          </span>
                        </div>
                      )}
                      {service.countStaff !== undefined && service.countStaff !== null && (
                        <div>
                          <h5 style={{ color: "#389e0d" }}>
                            Số lượng KTV: <span style={{ color: "#ff8c00", fontWeight: 600 }}>{service.countStaff}</span>
                          </h5>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: "#8c8c8c", fontStyle: "italic" }}>
                      <h4 style={{ color: "#8c8c8c" }}>Thông tin thực hiện</h4>
                      <h6 style={{ margin: 0, color: "#bfbfbf" }}>Chỉ áp dụng cho thủ thuật</h6>
                    </div>
                  )}
                </div>

                {/* Cột 3: Ngày */}
                <div style={{ 
                  backgroundColor: "#fff7e6", 
                  padding: "10px", 
                  borderRadius: 6,
                  border: "1px solid #ffd591"
                }}>
                  <h4 style={{ color: "#fa8c16" }}>Thông tin lịch hẹn</h4>
                  <h5 style={{ color: "#d46b08" }}>
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
        maxWidth: 1700,
        top: 10,
        paddingBottom: 10,
      }}
      footer={null}
      maskClosable={false}
      wrapClassName="schedule-selector-modal"
      getContainer={() => document.body}
      styles={{
        body: {
        padding: "16px",
        maxHeight: "calc(100vh - 200px)",
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
        <div style={{ width: "100%", overflowX: "auto", height: "100%" }}>
          <Table
            columns={tableColumns}
            dataSource={tableDataSource}
            pagination={false}
            bordered
            size="small"
            rowKey="key"
            tableLayout="fixed"
            scroll={{
              x: 120 + staffList.length * 200,
              y: "calc(100vh - 320px)",
            }}
          />
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
          setPendingStartTime(null);
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
              disabledHours={disabledStartHours}
              disabledMinutes={disabledStartMinutes}
              // minuteStep={30}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default ScheduleSelector;

