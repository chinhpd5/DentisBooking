import { Button, Col, DatePicker, Flex, Form, Input, Row, Select, Space } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { CreateCustomer } from "../../types/customer";
import { addCustomer } from "../../services/customer";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const { Option } = Select;

function CustomerAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateCustomer) => addCustomer(data),
    onSuccess: () => {
      Toast.success("Thêm khách hàng thành công");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      form.resetFields();
      navigate("/customer");
    },
  });

  const onFinish = (values: CreateCustomer & { dateOfBirth?: Dayjs | string }) => {
    const submitData: Omit<CreateCustomer, 'dateOfBirth'> & { dateOfBirth?: string } = {
      name: values.name,
      phone: values.phone,
      address: values.address,
      gender: values.gender || 'other',
      note: values.note || '',
      dateOfBirth: values.dateOfBirth && typeof values.dateOfBirth !== 'string' 
        ? dayjs(values.dateOfBirth).toISOString() 
        : values.dateOfBirth as string | undefined,
    };
    mutate(submitData as unknown as CreateCustomer);
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <h2>Thêm mới khách hàng</h2>

      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên khách hàng"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên khách hàng" },
                    { min: 1, message: "Tên khách hàng phải có ít nhất 1 ký tự" },
                    { max: 200, message: "Tên khách hàng tối đa 200 ký tự" },
                  ]}
                >
                  <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                    {
                      pattern: /^[0-9]{10}$/,
                      message: "Số điện thoại phải có đúng 10 chữ số",
                    },
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" maxLength={10} />
                </Form.Item>

                <Form.Item
                  name="gender"
                  label="Giới tính"
                >
                  <Select placeholder="Chọn giới tính">
                    <Option value="male">Nam</Option>
                    <Option value="female">Nữ</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="address"
                  label="Địa chỉ"
                  rules={[
                    { required: true, message: "Vui lòng nhập địa chỉ" },
                    { min: 5, message: "Địa chỉ phải có ít nhất 5 ký tự" },
                    { max: 300, message: "Địa chỉ tối đa 300 ký tự" },
                  ]}
                >
                  <Input.TextArea
                    placeholder="Nhập địa chỉ"
                    rows={5}
                    maxLength={300}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="dateOfBirth"
                  label="Ngày sinh"
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày sinh"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>

              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <Form.Item
                  name="note"
                  label="Ghi chú"
                  rules={[
                    { max: 500, message: "Ghi chú tối đa 500 ký tự" },
                  ]}
                >
                  <Input.TextArea
                    placeholder="Nhập ghi chú (nếu có)"
                    rows={3}
                    maxLength={500}
                    showCount
                  />
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

export default CustomerAdd;

