import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get('barcode');

  if (!barcode) {
    return NextResponse.json({ error: 'barcode is required' }, { status: 400 });
  }

  try {
    // Gọi OpenFoodFacts làm ví dụ minh họa (chủ yếu cho thực phẩm)
    // Đối với đồ điện tử, nhiều mã có thể không có dữ liệu và sẽ trả về 404 ở dưới.
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm cho mã vạch này trên OpenFoodFacts.' }, { status: 404 });
    }

    const p = data.product;

    // Một số field phổ biến của OpenFoodFacts
    const brand = p.brands || '';
    const categories = p.categories || p.categories_tags?.join(', ') || '';
    const image = p.image_url || p.image_front_url || '';
    const nutritionGrade = p.nutrition_grade_fr || p.nutrition_grades || '';

    return NextResponse.json({
      // Các field đã dùng trước đây (giữ nguyên tên để không hư frontend)
      TenHH: p.product_name || '',
      ThuongHieu: brand,
      DVT: p.quantity || '',
      Quantity: p.quantity || '',
      MoTa: p.generic_name || '',
      HinhAnh: image,

      // Các field mở rộng thêm cho tương lai
      Brand: brand,
      Categories: categories,
      Barcode: p.code || barcode,
      NutritionGrade: nutritionGrade,
      ImageFront: p.image_front_url || '',
      ImageIngredients: p.image_ingredients_url || '',
      ImageNutrition: p.image_nutrition_url || '',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Lỗi khi gọi dịch vụ mã vạch bên ngoài.' },
      { status: 500 },
    );
  }
}
