-- Replaces the stock (Unsplash) photos on raw cashew grades and on the three insights articles with
-- Cao Gia's own photos in /public/photos. Whole white grades (WW) show the kernels; split, piece and
-- scorched grades show the vacuum packing and cartons, since a whole-kernel close-up would misrepresent
-- them. Roasted and flavoured cashews keep their photos until own shots exist. Safe to run more than once.

update public.products set image = '/photos/cashew-kernels-closeup.jpg', gallery = array['/photos/cashew-vacuum-bags.jpg', '/photos/cashew-cartons-open.jpg']::text[], updated_at = now() where slug = 'cashew-ww160';
update public.products set image = '/photos/cashew-kernels-pile.jpg', gallery = array['/photos/cashew-cartons-open.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-ww180';
update public.products set image = '/photos/cashew-kernels-heap.jpg', gallery = array['/photos/cashew-vacuum-bag.jpg', '/photos/cashew-pallets.jpg']::text[], updated_at = now() where slug = 'cashew-ww210';
update public.products set image = '/photos/cashew-kernels-closeup.jpg', gallery = array['/photos/cashew-bags-pallet.jpg', '/photos/cashew-cartons-packing.jpg']::text[], updated_at = now() where slug = 'cashew-ww240';
update public.products set image = '/photos/cashew-kernels-pile.jpg', gallery = array['/photos/cashew-vacuum-bags.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-ww320';
update public.products set image = '/photos/cashew-kernels-heap.jpg', gallery = array['/photos/cashew-cartons-open.jpg', '/photos/cashew-pallets.jpg']::text[], updated_at = now() where slug = 'cashew-ww450';
update public.products set image = '/photos/cashew-vacuum-bag.jpg', gallery = array['/photos/cashew-cartons-open.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-sw180';
update public.products set image = '/photos/cashew-vacuum-bags.jpg', gallery = array['/photos/cashew-bags-pallet.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-sw240';
update public.products set image = '/photos/cashew-cartons-open.jpg', gallery = array['/photos/cashew-pallets.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-sw320';
update public.products set image = '/photos/cashew-bags-pallet.jpg', gallery = array['/photos/cashew-cartons-packing.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-lbw240';
update public.products set image = '/photos/cashew-pallets.jpg', gallery = array['/photos/cashew-vacuum-bag.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-lbw320';
update public.products set image = '/photos/cashew-cartons-packing.jpg', gallery = array['/photos/cashew-vacuum-bags.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-dw320';
update public.products set image = '/photos/cashew-vacuum-bag.jpg', gallery = array['/photos/cashew-cartons-open.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-dw360';
update public.products set image = '/photos/cashew-vacuum-bags.jpg', gallery = array['/photos/cashew-bags-pallet.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-sl';
update public.products set image = '/photos/cashew-cartons-open.jpg', gallery = array['/photos/cashew-pallets.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-sk1';
update public.products set image = '/photos/cashew-bags-pallet.jpg', gallery = array['/photos/cashew-cartons-packing.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-ws';
update public.products set image = '/photos/cashew-pallets.jpg', gallery = array['/photos/cashew-vacuum-bag.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-lwp';
update public.products set image = '/photos/cashew-cartons-packing.jpg', gallery = array['/photos/cashew-vacuum-bags.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-lp';
update public.products set image = '/photos/cashew-vacuum-bag.jpg', gallery = array['/photos/cashew-cartons-open.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-sp';
update public.products set image = '/photos/cashew-vacuum-bags.jpg', gallery = array['/photos/cashew-bags-pallet.jpg', '/photos/cashew-container-net.jpg']::text[], updated_at = now() where slug = 'cashew-wb';
update public.products set image = '/photos/cashew-cartons-open.jpg', gallery = array['/photos/cashew-pallets.jpg', '/photos/cashew-container-cartons.jpg']::text[], updated_at = now() where slug = 'cashew-bb';

update public.posts set cover = '/photos/cashew-kernels-closeup.jpg' where slug = 'cashew-kernel-grades-explained';
update public.posts set cover = '/photos/grade-robusta-s18.jpg' where slug = 'robusta-screen-sizes-s13-to-s18';
update public.posts set cover = '/photos/container-loading.jpg' where slug = 'fob-cfr-or-cif-importing-from-vietnam';
