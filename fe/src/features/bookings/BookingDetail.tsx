import { Button, Card, Descriptions, Spin, Tag, Divider } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBookingById } from "../../services/booking";
import dayjs from "dayjs";
import { BOOKING_STATUS } from "../../contants";
import IBooking from "../../types/booking";
import IService from "../../types/service";

function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading, error } = useQuery<IBooking>({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id!),
    enabled: !!id,
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Đã xảy ra lỗi khi tải dữ liệu</p>;
  if (!booking) return <p>Không tìm thấy lịch hẹn</p>;

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
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  return (
    <div>
      <Card
        title="Thông tin chi tiết lịch hẹn"
        extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Khách hàng">
            <div>
              <div><strong>{booking.customerId?.name || "-"}</strong></div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                SĐT: {booking.customerId?.phone || "-"}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>
                Địa chỉ: {booking.customerId?.address || "-"}
              </div>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Dịch vụ">
              <div><strong>{booking.serviceId?.name || "-"}</strong></div>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày hẹn">
            {booking.appointmentDate
              ? dayjs(booking.appointmentDate).format("DD/MM/YYYY HH:mm")
              : "Chưa cập nhật"}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian kết thúc">
            {booking.timeEnd
              ? dayjs(booking.timeEnd).format("DD/MM/YYYY HH:mm")
              : "Chưa cập nhật"}
          </Descriptions.Item>

          {booking.doctorDate && (
            <Descriptions.Item label="Ngày bác sỹ">
              {dayjs(booking.doctorDate).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Bác sỹ">
            {booking.doctorId?.name || "Chưa chỉ định"}
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái">
            {getStatusTag(booking.status)}
          </Descriptions.Item>

          {booking.status === BOOKING_STATUS.CANCELLED && booking.cancellationReason && (
            <Descriptions.Item label="Lý do hủy">
              <div style={{ maxWidth: 600, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {booking.cancellationReason}
              </div>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Ưu tiên">
            {booking.priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian đến">
            {booking.comingTime ? (
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 500 }}>
                {dayjs(booking.comingTime).format("DD/MM/YYYY HH:mm:ss")}
              </span>
            ) : (
              <span style={{ color: "#999" }}>Chưa cập nhật</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian bắt đầu làm">
            {booking.doingTime ? (
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 500 }}>
                {dayjs(booking.doingTime).format("DD/MM/YYYY HH:mm:ss")}
              </span>
            ) : (
              <span style={{ color: "#999" }}>Chưa cập nhật</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian hoàn thành">
            {booking.completeTime ? (
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 500 }}>
                {dayjs(booking.completeTime).format("DD/MM/YYYY HH:mm:ss")}
              </span>
            ) : (
              <span style={{ color: "#999" }}>Chưa cập nhật</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Ghi chú">
            {booking.note || "Không có ghi chú"}
          </Descriptions.Item>

          {booking.staffAssignments && booking.staffAssignments.length > 0 && (
            <Descriptions.Item label="Phân công nhân viên">
              {booking.staffAssignments.map((assignment, index: number) => (
                <div key={index} style={{ marginBottom: 8 }}>
                  <Divider style={{ margin: "8px 0" }} />
                  <div><strong>{assignment.staffId?.name || "-"}</strong></div>
                  <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                    Dịch vụ: {assignment.serviceIds?.map((s: IService) => s.name).join(", ") || "-"}
                  </div>
                  <div style={{ fontSize: 14, color: "#666" }}>
                    Bắt đầu: {dayjs(assignment.timeStart).format("DD/MM/YYYY HH:mm")}
                  </div>
                  <div style={{ fontSize: 14, color: "#666" }}>
                    Kết thúc: {dayjs(assignment.timeEnd).format("DD/MM/YYYY HH:mm")}
                  </div>
                </div>
              ))}
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Ngày tạo">
            {booking.createdAt
              ? dayjs(booking.createdAt).format("DD/MM/YYYY HH:mm:ss")
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày cập nhật">
            {booking.updatedAt
              ? dayjs(booking.updatedAt).format("DD/MM/YYYY HH:mm:ss")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

export default BookingDetail;
