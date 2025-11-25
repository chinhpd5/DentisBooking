import { Button, Col, Flex, Form, Input, Row, Select, Space } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { CreateSeat } from "../../types/seat";
import { addSeat } from "../../services/seat";
import { getListLocation } from "../../services/location";
import { SEAT_STATUS } from "../../contants";
import ILocation from "../../types/location";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

function SeatAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: locationList } = useQuery({
    queryKey: ["locations"],
    queryFn: () => getListLocation(),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateSeat) => addSeat(data),
    onSuccess: () => {
      Toast.success("Thêm ghế thành công");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      form.resetFields();
      navigate("/seat");
    },
    // onError: (err: unknown) => {
    //   const error = err as { response?: { data?: { message?: string } } };
    //   Toast.error("Thêm ghế thất bại: " + (error.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const onFinish = (values: Record<string, unknown>) => {
    const submitData: CreateSeat = {
      name: values.name as string,
      locationId: values.locationId as string || undefined,
      status: (values.status as SEAT_STATUS) || SEAT_STATUS.AVAILABLE,
      description: (values.description as string) || "",
    };
    
    mutate(submitData);
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Thêm mới ghế</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/seat")}>
          Quay lại
        </Button>
      </Flex>

      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
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
              rules={[
                { required: true, message: "Vui lòng chọn vị trí" },
              ]}
            >
                  <Select 
                    placeholder="Chọn vị trí" 
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (String(option?.label ?? '')).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {locationList?.data?.map((location: ILocation) => (
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
                  initialValue={SEAT_STATUS.AVAILABLE}
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
                  <TextArea rows={4} placeholder="Nhập mô tả (không bắt buộc)" />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="start">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Thêm mới
                  </Button>
                  <Button onClick={onReset}>Nhập lại</Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>
    </div>
  );
}

export default SeatAdd;

