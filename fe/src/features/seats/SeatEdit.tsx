import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import Toast from "react-hot-toast";
import { getSeatById, updateSeat } from "../../services/seat";
import { getListLocation } from "../../services/location";
import ISeat, { CreateSeat } from "../../types/seat";
import { SEAT_STATUS } from "../../contants";

const { Option } = Select;
const { TextArea } = Input;

function SeatEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: seat, isLoading } = useQuery<ISeat>({
    queryKey: ["seat", id],
    queryFn: () => getSeatById(id!),
    enabled: !!id,
  });

  const { data: locationList } = useQuery({
    queryKey: ["locations"],
    queryFn: () => getListLocation(),
  });

  useEffect(() => {
    if (seat) {
      // Xử lý locationId - chuyển từ object sang string nếu cần
      const locationId = typeof seat.locationId === 'object' && seat.locationId 
        ? seat.locationId._id 
        : seat.locationId || undefined;

      form.setFieldsValue({
        name: seat.name,
        locationId: locationId,
        status: seat.status,
        description: seat.description || "",
      });
    }
  }, [seat, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSeat> }) =>
      updateSeat(id, data),
    onSuccess: () => {
      Toast.success("Cập nhật ghế thành công");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      navigate("/seat");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.error("Cập nhật thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    },
  });

  const onFinish = (values: Partial<CreateSeat>) => {
    if (id) {
      mutate({ id, data: values });
    }
  };

  if (isLoading) return <Spin />;

  return (
    <div>
      <h2>Cập nhật ghế</h2>
      <Flex justify="center">
        <div style={{ minWidth: 1000 }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên ghế"
                  rules={[{ required: true, message: "Vui lòng nhập tên ghế" }]}
                >
                  <Input placeholder="Nhập tên ghế" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="locationId"
                  label="Vị trí"
                >
                  <Select 
                    placeholder="Chọn vị trí" 
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {locationList?.data?.map((location) => (
                      <Option key={location._id} value={location._id} label={location.name}>
                        {location.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value={SEAT_STATUS.AVAILABLE}>Sẵn sàng</Option>
                    <Option value={SEAT_STATUS.USING}>Đang sử dụng</Option>
                    <Option value={SEAT_STATUS.REPAIR}>Đang sửa chữa</Option>
                    <Option value={SEAT_STATUS.DISABLED}>Vô hiệu</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="description"
                  label="Mô tả"
                >
                  <TextArea rows={4} placeholder="Nhập mô tả" />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Cập nhật
                  </Button>
                  <Button htmlType="button" onClick={() => form.resetFields()}>
                    Reset
                  </Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>
    </div>
  );
}

export default SeatEdit;

