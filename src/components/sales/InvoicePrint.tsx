import React from 'react';
import type { Invoice } from '../../types';

interface InvoicePrintProps {
    invoice: Invoice;
    template?: 'standard' | 'detailed';
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({ invoice, template = 'standard' }) => {
    const formatCurrency = (value: number) => `EGP ${value.toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');

    // Convert number to Arabic words (simplified)
    const numberToArabicWords = (num: number): string => {
        const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
        const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
        const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

        if (num === 0) return 'صفر';

        const intPart = Math.floor(num);
        const decPart = Math.round((num - intPart) * 100);

        let result = '';

        if (intPart >= 1000) {
            const thousands = Math.floor(intPart / 1000);
            result += (thousands === 1 ? 'ألف' : thousands === 2 ? 'ألفان' : thousands + ' آلاف') + ' و ';
        }

        const remainder = intPart % 1000;
        if (remainder >= 100) {
            result += hundreds[Math.floor(remainder / 100)] + ' و ';
        }

        const tensRemainder = remainder % 100;
        if (tensRemainder >= 20) {
            const unitsDigit = tensRemainder % 10;
            if (unitsDigit > 0) {
                result += units[unitsDigit] + ' و ';
            }
            result += tens[Math.floor(tensRemainder / 10)];
        } else if (tensRemainder >= 10) {
            result += units[tensRemainder - 10] + ' عشر';
        } else if (tensRemainder > 0) {
            result += units[tensRemainder];
        }

        result = result.replace(/ و $/, '');

        if (decPart > 0) {
            return `فقط ${result} جنيه مصري فقط لا غير`;
        }
        return `فقط ${result} جنيه مصري لا غير`;
    };

    return (
        <div className="invoice-print-container">
            {/* ========== PAGE 1: INVOICE ========== */}
            <div className="print-page" dir="rtl">
                <div className="page-content">
                    {/* Header with Logo */}
                    <div className="invoice-header">
                        <div className="header-logo">
                            <img src="/logo_invoice.png" alt="iHome System" className="print-logo" />
                        </div>
                        <div className="header-title">
                            <h1>فاتورة مبيعات</h1>
                            <p>Sales Invoice</p>
                        </div>
                        <div className="header-info">
                            <div className="invoice-number-box">
                                <span className="label">رقم الفاتورة</span>
                                <span className="value">{invoice.invoiceNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Invoice Info Section */}
                    <div className="info-section">
                        <div className="customer-box">
                            <h3>بيانات العميل</h3>
                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td className="label-cell">اسم العميل:</td>
                                        <td className="value-cell">{invoice.customer?.name || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-cell">رقم الموبايل:</td>
                                        <td className="value-cell ltr">{invoice.customer?.phone || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-cell">العنوان:</td>
                                        <td className="value-cell">{invoice.customer?.address || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="invoice-details-box">
                            <h3>بيانات الفاتورة</h3>
                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td className="label-cell">تاريخ الفاتورة:</td>
                                        <td className="value-cell ltr">{formatDate(invoice.createdAt)}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-cell">تاريخ الاستحقاق:</td>
                                        <td className="value-cell ltr">{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-cell">حالة الدفع:</td>
                                        <td className="value-cell">
                                            <span className={`status-badge ${invoice.status}`}>
                                                {invoice.status === 'paid' ? 'مدفوع ✓' : 'غير مدفوع'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="products-section">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th className="col-num">#</th>
                                    <th className="col-img">صورة</th>
                                    <th className="col-product">المنتج / الخدمة</th>
                                    <th className="col-price">سعر الوحدة</th>
                                    <th className="col-qty">الكمية</th>
                                    {template === 'detailed' && <th className="col-discount">الخصم</th>}
                                    <th className="col-total">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="col-num">{index + 1}</td>
                                        <td className="col-img">
                                            <div className="product-thumb">
                                                {/* Product image placeholder */}
                                            </div>
                                        </td>
                                        <td className="col-product">
                                            <strong>{item.productName}</strong>
                                        </td>
                                        <td className="col-price ltr">{formatCurrency(item.unitPrice)}</td>
                                        <td className="col-qty">{item.quantity}</td>
                                        {template === 'detailed' && (
                                            <td className="col-discount ltr" style={{ color: 'var(--color-error-400)' }}>
                                                {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                                            </td>
                                        )}
                                        <td className="col-total ltr">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="totals-section">
                        <div className="totals-box">
                            <div className="total-row">
                                <span className="total-label">إجمالي المنتجات:</span>
                                <span className="total-value ltr">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="total-row discount">
                                    <span className="total-label">
                                        الخصم ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'مبلغ ثابت'}):
                                    </span>
                                    <span className="total-value ltr">- {formatCurrency(invoice.discount)}</span>
                                </div>
                            )}
                            <div className="total-row grand-total">
                                <span className="total-label">الإجمالي النهائي:</span>
                                <span className="total-value ltr">{formatCurrency(invoice.total)}</span>
                            </div>
                            <div className="total-row words">
                                <span className="total-label">المبلغ بالحروف:</span>
                                <span className="total-value-words">{numberToArabicWords(invoice.total)}</span>
                            </div>
                        </div>
                        {/* Signature & Payment */}

                        <div className="footer-section">
                            {/* <div className="signature-box">
                            <p>توقيع العميل</p>
                            <div className="signature-line"></div>
                        </div> */}
                            <div className="signature-box">
                                <p>توقيع البائع</p>
                                <div className="signature-line"></div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Bottom Contact Bar */}
                <div className="contact-bar">
                    <div className="contact-bar-inner">
                        <div className="contact-item">
                            <span className="icon">📞</span>
                            <span>0502735551</span>
                        </div>
                        <div className="contact-item">
                            <span className="icon">📱</span>
                            <span>01000281662</span>
                        </div>
                        <div className="contact-item">
                            <span className="icon">🌐</span>
                            <span>ihome-store.com</span>
                        </div>
                        <div className="contact-item">
                            <span className="icon">📍</span>
                            <span>المنصورة، شارع سامية الجمل مقابل سيرا للمفروشات</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== PAGE 2: TERMS & CONDITIONS ========== */}
            <div className="print-page page-break" dir="rtl">
                <div className="page-content">
                    <div className="terms-header">
                        <h1>شروط الضمان</h1>
                    </div>

                    <div className="terms-content">
                        <h3>الشروط والأحكام:</h3>
                        <ul className="terms-list">
                            <li>الضمان لمدة <strong>سبعة أعوام</strong> على أي منتج يحمل العلامة التجارية سونوف.</li>
                            <li>في حالة تعذر إصلاح المنتج في المركز أو الفرع يحق للعميل استبدال المنتج المكسور أو المحروق مقابل 50٪ من قيمة المنتج الرسمي المعلن على الموقع الإلكتروني.</li>
                            <li>ضمان <strong>6 سنوات</strong> على اقفال lezn.</li>
                            <li>ضمان <strong>5 سنوات</strong> على اقفال PNDA.</li>
                            <li>الضمان <strong>عامين</strong> على منتجات EWELINK و SURPASS.</li>
                            <li>الضمان <strong>عام واحد</strong> على منتجات TUYA أو أي منتج آخر بخلاف ماسبق.</li>
                            <li>الضمان <strong>لا يشمل البطاريات والكابلات</strong>.</li>
                            <li>الاستبدال خلال <strong>14 يومًا</strong> من تاريخ الشراء، وذلك إذا كان بها أي عيب صناعة، أو كانت غير مطابقة للمواصفات.</li>
                            <li>الاسترجاع خلال <strong>7 أيام</strong> فقط دون إبداء أسباب الاسترجاع طالما لم يتم فتح المنتج.</li>
                            <li>يجب على العميل <strong>الاحتفاظ بالفاتورة</strong> أو إثبات الشراء حتى يستطيع الاستفادة بالضمان.</li>
                            <li>الشركة غير ملزمة في عدم تشغيل المنتج خلال الفترات القانونية للاسترجاع والاستبدال.</li>
                            <li>في حالة فقدان أحد أو <strong>قطع أو إزالة الأرقام المسلسلة</strong> الموجودة على المنتج <strong>تكون خارج الضمان</strong>.</li>
                            <li>لا يحق للعميل عمل صيانة للقطع التي تم تعديلها بأيًا كان طلبه أو تم عمل تعديل عليها خصيصًا من أجله أو استبدالها بقطع أخرى.</li>
                            <li>للشركة الرجوع بالحق القانوني على العميل في حالة التحايل بإرجاع منتجات تم شراءها بطريقة غير رسمية.</li>
                            <li>يجب على العميل <strong>معاينة المنتج</strong> عند الاستلام للتأكد من خلوه من أي كسور أو عيوب ظاهرة.</li>
                        </ul>
                    </div>

                    <div className="company-info-center">
                        <h2>شركة اي هوم للأنظمة الذكية</h2>
                        <p>الموزع المعتمد لمنتجات سونوف في المنصورة،</p>
                        <p className="thanks">نتمنى لكم تشغيلًا آمنًا ومعمرًا لمنتجاتنا.</p>
                        <p className="website-small">للاستفسارات والدعم الفني</p>
                        <p className="website-small"><strong>ihome-store.com</strong></p>
                        <p className="website-small">شكراً لثقتكم بنا</p>
                    </div>
                </div>

                {/* Bottom Contact Bar */}
                <div className="contact-bar">
                    <div className="contact-bar-inner">
                        <div className="contact-item">
                            <span className="icon">📞</span>
                            <span>0502735551</span>
                        </div>
                        <div className="contact-item">
                            <span className="icon">📱</span>
                            <span>01000281662</span>
                        </div>
                        <div className="contact-item">
                            <span className="icon">🌐</span>
                            <span>ihome-store.com</span>
                        </div>
                        <div className="contact-item">
                            <span className="icon">📍</span>
                            <span>المنصورة، شارع سامية الجمل مقابل سيرا للمفروشات</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePrint;
