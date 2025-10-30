import { Button, Col, Flex, Form, Input, Row, Select, Space } from "antd";
const { Option } = Select;
import {convertNameRoleArray} from "../../utils/helper";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {addStaff} from "../../services/staff";
import Toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { CreateStaff } from "../../types/staff";
import { STAFF_STATUS } from "../../contants";

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

const dataRole = convertNameRoleArray();

function StaffAdd() {
  const navigate = useNavigate()
  const [form] = Form.useForm();

  const queryClient = useQueryClient();
  
  const {mutate, isPending} = useMutation({
    mutationFn:  (data: CreateStaff) => addStaff(data),
    onSuccess: () => {
      Toast.success("Thêm mới nhân viên thành công");
      queryClient.invalidateQueries({queryKey: ["staffs"]});
      form.resetFields();
      navigate('/staff')
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      Toast.error("Thêm tài khoản thất bại: " + error.response?.data?.message);
    }
  });

  const onFinish = (values: CreateStaff) => {
    mutate(values);
  };

  const onReset = () => {
    form.resetFields();
  };

 
  return (
    <div>
      <h2>Thêm mới nhân viên</h2>

      <Flex justify="center">
        <div style={{ minWidth: 1200 }}>
          <Form
            form={form}
            name="control-hooks"
            initialValues={{
              status: STAFF_STATUS.ACTIVE
            }}
            onFinish={onFinish}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item layout="vertical" name="name" label="Họ và tên:" rules={[
                  { 
                    required: true,
                    message: "Họ và tên là bắt buộc"
                  }
                  ]}>
                  <Input />
                </Form.Item>

                <Form.Item layout="vertical" name="phone" label="Số điện thoại:" rules={[
                  {
                    required: true,
                    message: "Số điện thoại là bắt buộc",
                  },
                  {
                    pattern: /^0\d{9}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}>
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  layout="vertical" 
                  name="role"
                  label="Vai trò:"
                  rules={[{ required: true, message: "Nhập vai trò cho tài khoản" }]}
                >
                  <Select
                    placeholder="Chọn vai trò"
                    // onChange={}
                    allowClear
                  >
                    {
                      dataRole.map(item => {
                        return <Option value={item.value}>{item.name}</Option>
                      })
                    }
                  </Select>
                </Form.Item>
                <Form.Item layout="vertical" name="email" label="Email:" rules={[
                  {
                    required: false,
                    },
                  {
                    type: "email",
                    message: "Email không đúng định dạng",
                  },
                ]}>
                  <Input />
                </Form.Item>
                <Form.Item layout="vertical" name="status" initialValue={STAFF_STATUS.ACTIVE} label="Trạng thái:" rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" }]}>
                  <Select placeholder="Chọn trạng thái">
                    <Option value={STAFF_STATUS.ACTIVE} key={STAFF_STATUS.ACTIVE} selected>Đang làm</Option>
                    <Option value={STAFF_STATUS.DISABLED} key={STAFF_STATUS.DISABLED}>Đã nghỉ</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end" gutter={24}>
              <Form.Item {...tailLayout}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Submit
                  </Button>
                  <Button htmlType="button" onClick={onReset}>
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

export default StaffAdd;
