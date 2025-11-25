# Phân tích luồng thêm mới Booking

## Tổng quan
Luồng thêm mới booking bao gồm 2 phần chính: **Frontend (React)** và **Backend (Node.js)**

---

## FRONTEND - BookingAdd.tsx

### 1. Tìm kiếm/Tạo khách hàng
```
User nhập số điện thoại (10 chữ số)
    ↓
Tự động tìm kiếm qua getCustomerByPhone()
    ↓
┌─────────────────┬─────────────────┐
│ Tìm thấy        │ Không tìm thấy   │
│ Auto-fill form  │ Reset form      │
└─────────────────┴─────────────────┘
```

### 2. Chọn Service
- Load danh sách services
- Filter: `type === "trick"` HOẶC `type === "job" && isFirst === false`
- Khi chọn service khác → Reset appointment date

### 3. Chọn ngày khám
- DatePicker: không cho chọn quá khứ
- Sau khi chọn → Enable ScheduleSelector

### 4. Chọn lịch hẹn (ScheduleSelector)
```
Mở ScheduleSelector modal
    ↓
Load danh sách staff (DOCTOR/STAFF)
    ↓
Filter staff:
  - Job type: chỉ STAFF (KTV)
  - Trick type: DOCTOR hoặc staff trong service.staffIds
    ↓
Hiển thị lịch làm việc (8:00 - 22:00, mỗi 30 phút)
    ↓
User click vào slot trống
    ↓
Mở modal chỉnh sửa thời gian
    ↓
Tính toán:
  - startTime: từ slot hoặc thời gian kết thúc booking trước đó
  - endTime: startTime + service.time + sum(jobIds.time)
    ↓
Trả về ScheduleSelectionInfo:
  {
    staffId, staffName, staffRole,
    startTime, endTime, serviceType
  }
```

### 5. Submit form (onFinish)
```
Kiểm tra customerId
    ↓
┌─────────────────┬─────────────────┐
│ Chưa có         │ Đã có           │
│ Tạo customer    │ Kiểm tra thay đổi│
│                 │ → Cập nhật nếu có│
└─────────────────┴─────────────────┘
    ↓
Kiểm tra đã chọn lịch hẹn và service
    ↓
Tính toán bookingData:
  - appointmentDate: selectedTimeSlot
  - timeEnd: selectedEndTime
  - doctorDate: timeEnd - service.time (chỉ trick type)
  - doctorId: selectedDoctorId (cho cả trick và job)
    ↓
Lưu vào pendingBookingData
    ↓
Mở modal xác nhận
```

### 6. Xác nhận và gửi request
```
User xác nhận trong modal
    ↓
Gọi addBooking(pendingBookingData)
    ↓
POST /booking
```

---

## BACKEND - booking.controller.js

### 1. Validate Service
```javascript
const service = await Service.findById(data.serviceId);
if (!service) return error;
```

### 2. Kiểm tra giờ nghỉ
```javascript
if (data.doctorId && await isTimeEndDuringBreak(data.timeEnd, data.doctorId)) {
  return error: "Thời gian kết thúc không được nằm trong giờ nghỉ"
}
```

### 3. Kiểm tra conflict

#### TRICK type:
```javascript
Kiểm tra conflict trong Booking:
  - doctorId trùng
  - [appointmentDate, timeEnd] overlap với booking khác
  → Nếu conflict: return 409
```

#### JOB type:
```javascript
Kiểm tra conflict trong StaffAssignment:
  - staffId (từ doctorId) trùng
  - [appointmentDate, timeEnd] overlap với assignment khác
  → Nếu conflict: return 409
```

### 4. Chuẩn bị booking data
```javascript
const bookingData = {
  ...data,
  type: serviceType
};

// JOB type: xóa doctorDate và doctorId
if (serviceType === SERVICE_TYPE.JOB) {
  delete bookingData.doctorDate;
  delete bookingData.doctorId;
}

// TRICK type: tính doctorDate nếu chưa có
if (serviceType === SERVICE_TYPE.TRICK && !bookingData.doctorDate) {
  bookingData.doctorDate = timeEnd - service.time;
}
```

### 5. Tạo Booking
```javascript
const booking = await Booking.create(bookingData);
```

### 6. Xử lý Staff Assignments

#### JOB type:
```javascript
Tạo StaffAssignment:
  {
    staffId: data.doctorId,  // Lưu ý: doctorId thực tế là staffId
    serviceIds: [data.serviceId],
    timeStart: appointmentDate,
    timeEnd: timeEnd,
    bookingId: booking._id
  }
  ↓
Lưu assignment._id vào booking.staffAssignments
```

#### TRICK type (có jobIds và countStaff):
```javascript
autoAssignStaffForJobs():
  1. Lấy tất cả KTV khả dụng (role = STAFF, status = 1)
  2. Tính tổng thời gian: sum(jobIds.time)
  3. Tìm KTV không conflict trong [appointmentDate, appointmentDate + totalJobTime]
  4. Tạo StaffAssignment cho mỗi KTV:
     - Mỗi KTV nhận TẤT CẢ jobIds
     - timeStart: appointmentDate
     - timeEnd: appointmentDate + totalJobTime
  5. Cần đủ số lượng KTV theo countStaff
     → Nếu không đủ: xóa booking và return error
```

### 7. Trả về kết quả
```javascript
Populate đầy đủ:
  - customerId
  - doctorId
  - serviceId
  - staffAssignments (với staffId và serviceIds)
    ↓
Return booking đã tạo
```

---

## Điểm quan trọng cần lưu ý

### 1. Service Type
- **TRICK**: Bác sĩ thực hiện, có thể có jobIds (KTV hỗ trợ)
- **JOB**: KTV thực hiện, không có doctorId trong booking

### 2. doctorId trong request
- **TRICK type**: `doctorId` = ID của bác sĩ → lưu vào `booking.doctorId`
- **JOB type**: `doctorId` = ID của KTV → KHÔNG lưu vào booking, chỉ dùng để tạo StaffAssignment

### 3. doctorDate
- Chỉ có cho **TRICK type**
- Tính: `timeEnd - service.time`
- Là thời gian bác sĩ bắt đầu làm việc

### 4. Staff Assignments
- **JOB type**: 1 StaffAssignment với 1 KTV
- **TRICK type**: Nhiều StaffAssignment (nếu có jobIds và countStaff), mỗi KTV nhận tất cả jobIds

### 5. Conflict checking
- **TRICK**: Kiểm tra trong Booking collection
- **JOB**: Kiểm tra trong StaffAssignment collection

---

## Luồng dữ liệu

```
Frontend Form
    ↓
ScheduleSelector (chọn staff + thời gian)
    ↓
onFinish (chuẩn bị bookingData)
    ↓
POST /booking
    ↓
Backend: createBooking()
    ↓
Validate → Check conflict → Create booking → Create assignments
    ↓
Return populated booking
```

