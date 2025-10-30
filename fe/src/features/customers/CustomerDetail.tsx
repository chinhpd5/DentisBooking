import { Button, Card, Descriptions, Spin, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomerById } from "../../services/customer";
import dayjs from "dayjs";

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  });

  if (isLoading) return <Spin />;
  if (error) return <p>Đã xảy ra lỗi khi tải dữ liệu</p>;
  if (!customer) return <p>Không tìm thấy khách hàng</p>;

  return (
    <Card
      title="Thông tin chi tiết khách hàng"
      extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      style={{ maxWidth: 800, margin: "0 auto" }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tên khách hàng">{customer.name}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{customer.phone}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">{customer.address}</Descriptions.Item>
        <Descriptions.Item label="Ngày sinh">
          {customer.dateOfBirth 
            ? dayjs(customer.dateOfBirth).format("DD/MM/YYYY") 
            : "Chưa cập nhật"}
        </Descriptions.Item>
        <Descriptions.Item label="Giới tính">
          {customer.gender === "male" 
            ? <Tag color="blue">Nam</Tag>
            : customer.gender === "female"
            ? <Tag color="pink">Nữ</Tag>
            : customer.gender === "other"
            ? <Tag>Khác</Tag>
            : "Chưa cập nhật"}
        </Descriptions.Item>
        <Descriptions.Item label="Ghi chú">
          {customer.note || "Không có ghi chú"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default CustomerDetail;

